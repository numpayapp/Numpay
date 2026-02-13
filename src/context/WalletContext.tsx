import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { showError, showSuccess } from "../lib/utils";
import { useCreateKernel } from "../hooks/use-create-kernel";
import { parseUnits, formatUnits, erc20Abi, encodeFunctionData } from "viem";
import { useWallets, useFundWallet } from "@privy-io/react-auth";
import { useSmartWalletBalance } from "../hooks/use-balance";
import { axiosInstance } from "../utils/axios";
import { USDC_ADDRESS } from "../utils/constants";

interface Transaction {
  txhash: string;
  type: "send" | "receive" | "request" | "deposit";
  amount: number;
  recipient?: string;
  sender?: string;
  status: "completed" | "pending" | "failed";
}

interface MoneyRequest {
  id: string;
  requesterId: string;
  payerId: string;
  amountRequested: number;
  requestStatus: "PENDING" | "CANCELED" | "APPROVED" | "REJECTED";
  requestDate: Date;
  requestMessage?: string;
  requestType: "GLOBAL" | "DIRECT";
  requester: {
    name: string | null;
    phoneNumber: string;
  };
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  moneyRequests: MoneyRequest[];
  sendMoney: (amount: number, recipient: string) => Promise<boolean>;
  requestMoney: (amount: number, from: string, requestType: "GLOBAL" | "DIRECT", message?: string) => Promise<{ success: boolean; requestId?: string }>;
  cancelRequest: (requestId: string) => Promise<boolean>;
  updateRequestStatus: (requestId: string, status: "CANCELED" | "APPROVED" | "REJECTED") => Promise<boolean>;
  addFunds: (amount: number, method: "card" | "apple_pay" | "google_pay") => Promise<boolean>;
  pendingRequests: MoneyRequest[];
  getRequestDetails: (requestId: string) => Promise<MoneyRequest | null>;
}

type FundingMethod = 'card' | 'apple_pay' | 'google_pay';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Helper function to convert display format to E.164
const toE164Format = (phone: string): string => {
  return phone.replace(/\s+/g, "");
};

// Helper function to convert E.164 to display format
const toDisplayFormat = (phone: string): string => {
  if (!phone) return "";
  const dialCode = phone.slice(0, 3); // Assuming country code is 3 digits
  const number = phone.slice(3);
  return `${dialCode} ${number}`;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const balanceWei = useSmartWalletBalance();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [moneyRequests, setMoneyRequests] = useState<MoneyRequest[]>([]);
  const { user } = useAuth();
  const { kernelClient, address } = useCreateKernel();
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet();

  useEffect(() => {
    if (balanceWei) {
      const ethBalance = parseFloat(formatUnits(balanceWei, 6));
      setBalance(ethBalance);
    }
  }, [balanceWei]);

  useEffect(() => {
    if (user) {
      const embedded = wallets.find(w => w.walletClientType === 'privy');
      if (!embedded) return;

      const storedTransactions = localStorage.getItem("wallet_transactions");

      if (storedTransactions) {
        const parsedTransactions = JSON.parse(storedTransactions).map((tx) => ({
          ...tx,
          timestamp: new Date(tx.timestamp),
        }));
        setTransactions(parsedTransactions);
      }
    }
  }, [user, wallets, address]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("wallet_transactions", JSON.stringify(transactions));
    }
  }, [transactions, user]);

  const sendMoney = async (
    amount: number,
    recipient: string
  ): Promise<boolean> => {
    try {
      if (!kernelClient) throw new Error('Wallet not ready');
      console.log("kernel client`", kernelClient);
      if (amount <= 0) throw new Error("Amount must be greater than 0");
      if (amount > balance) throw new Error("Insufficient funds");

      type DbUser = { 
        id: string;
        walletAddress: string 
      };
      let dbUser: DbUser;
      try {
        const resp = await axiosInstance.get<DbUser>(`/api/user/phone/${encodeURIComponent(recipient)}`);
        dbUser = resp.data;
      } catch (e) {
        if (e.response?.status === 404 || e.response?.data.message === "User not found") {
          const createResp = await axiosInstance.post("/api/user/pregenerate", {
            phoneNumber: recipient,
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = createResp.data as any;
          const walletAddr = data.walletAddress;
          dbUser = { id: data.id, walletAddress: walletAddr };
        } else {
          throw e;
        }
      }

      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [
          dbUser.walletAddress as `0x${string}`, 
          parseUnits(amount.toString(), 6)
        ],
      })

      const txHash = await kernelClient.sendTransaction({
        to: USDC_ADDRESS,
        data: data
      });

      const transaction: Transaction = {
        txhash: txHash,
        type: "send",
        amount,
        sender: address,
        recipient: dbUser.walletAddress,
        status: "completed"
      };
      console.log("transaction", transaction);

      await axiosInstance.post("/api/transaction", {
        txhash: txHash,
        senderAddress: address,
        receiverAddress: dbUser.walletAddress,
        amount,
        transactionType: "SEND",
        transactionStatus: "COMPLETED",
      });

      setTransactions((prev) => [transaction, ...prev]);
      showSuccess(
        "Money sent!",
        `You sent $${amount.toFixed(
          2
        )} to ${recipient}`
      );

      return true;
    } catch (error) {
      console.error("Send money error:", error);
      showError("Send money failed", error.message || "Failed to send money");
      return false;
    }
  };

  const requestMoney = async (
    amount: number,
    from: string,
    requestType: "GLOBAL" | "DIRECT",
    message?: string
  ): Promise<{ success: boolean; requestId?: string }> => {
    try {
      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      let response;
      if (requestType === "GLOBAL") {
        response = await axiosInstance.post("/api/request/global", {
          requesterId: user?.dbId,
          amountRequested: amount,
          message: message
        });
      } else {
        // Get user details for the payer
        let payerId = "";
        try {
          const e164Phone = toE164Format(from);
          const resp = await axiosInstance.get(`/api/user/phone/${encodeURIComponent(e164Phone)}`);
          payerId = resp.data.id;
        } catch (e) {
          if (e.response?.status === 404) {
            const createResp = await axiosInstance.post("/api/user/pregenerate", {
              phoneNumber: toE164Format(from),
            });
            payerId = createResp.data.id;
          } else {
            throw e;
          }
        }

        response = await axiosInstance.post("/api/request/", {
          requesterId: user?.dbId,
          payerId: payerId,
          payerPhone: toE164Format(from),
          amountRequested: amount,
          message: message,
          requestType: "DIRECT"
        });
      }

      const newRequest: MoneyRequest = {
        ...response.data,
        requestDate: new Date(response.data.requestDate)
      };

      setMoneyRequests(prev => [newRequest, ...prev]);

      showSuccess(
        "Request sent!",
        `You have requested $${amount.toFixed(2)} ${requestType === "DIRECT" ? `from ${from}` : ""}`
      );

      return { success: true, requestId: response.data.requestId };
    } catch (error) {
      console.error("Request money error:", error);
      showError(
        "Request money failed",
        error.response?.data.error || "Failed to request money"
      );
      return { success: false };
    }
  };

  const cancelRequest = async (requestId: string): Promise<boolean> => {
    try {
      await axiosInstance.post(`/api/request/cancel/${requestId}`);

      setMoneyRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, requestStatus: "CANCELED" }
            : req
        )
      );

      showSuccess("Request cancelled", "Money request has been cancelled successfully");
      return true;
    } catch (error) {
      console.error("Cancel request error:", error);
      showError("Failed to cancel request", error.message || "Could not cancel the request");
      return false;
    }
  };

  const updateRequestStatus = async (
    requestId: string,
    status: "CANCELED" | "APPROVED" | "REJECTED" | "PENDING"
  ): Promise<boolean> => {
    try {
      await axiosInstance.put(`/api/request/update-status/${requestId}`, {
        status: status
      });

      setMoneyRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, requestStatus: status }
            : req
        )
      );

      showSuccess(
        "Request updated",
        `Request has been ${status.toLowerCase()} successfully`
      );
      return true;
    } catch (error) {
      console.error("Update request status error:", error);
      showError("Failed to update request", error.message || "Could not update the request status");
      return false;
    }
  };

  useEffect(() => {
    if (user?.id) {
      const fetchRequests = async () => {
        try {
          const response = await axiosInstance.get(`/api/request/get/all/${user.dbId}`);
          setMoneyRequests(response.data.map((req: MoneyRequest) => {
            // Ensure we have a valid date
            let requestDate: Date;
            try {
              requestDate = new Date(req.requestDate);
              if (isNaN(requestDate.getTime())) {
                console.error('Invalid date received:', req.requestDate);
                requestDate = new Date(); // Fallback to current date
              }
            } catch (error) {
              console.error('Error parsing date:', error);
              requestDate = new Date(); // Fallback to current date
            }

            return {
              ...req,
              requestDate
            };
          }));
        } catch (error) {
          console.error("Error fetching money requests:", error);
        }
      };
      fetchRequests();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.dbId]);

  const addFunds = async (amount: number, method: FundingMethod): Promise<boolean> => {
    if (!address) {
      console.error('No wallet address found for funding.');
      return false;
    }
    try {
      let defaultFundingMethod: 'card' | 'exchange' | 'wallet' | 'manual';
      switch (method) {
        case 'card':
        case 'apple_pay':
        case 'google_pay':
          defaultFundingMethod = 'card';
          break;
        default:
          defaultFundingMethod = 'card';
      }
      await fundWallet(address, {
        amount: amount.toString(),
        defaultFundingMethod,
      });

      const tx = {
        txhash: `0x${Math.floor(Math.random() * 1e16).toString(16)}`,
        amount,
        method,
        status: 'success',
      };
      console.log('Transaction:', tx);
      return true;
    } catch (error) {
      console.error('addFunds error:', error);
      return false;
    }
  };

  const getRequestDetails = async (requestId: string): Promise<MoneyRequest | null> => {
    try {
      console.log("Fetching request details for ID:", requestId);
      const response = await axiosInstance.get(`/api/request/get/${requestId}`);
      console.log("Request details response:", response.data);
      
      if (!response.data) {
        console.error("No data received from API");
        return null;
      }

      return {
        ...response.data,
        requestDate: new Date(response.data.requestDate),
        requester: {
          name: response.data.requester?.name || null,
          phoneNumber: response.data.requester?.phoneNumber || response.data.requesterPhone
        }
      };
    } catch (error) {
      console.error("Error fetching request details:", error.response?.data || error);
      return null;
    }
  };

  const value = {
    balance,
    transactions,
    moneyRequests,
    sendMoney,
    requestMoney,
    cancelRequest,
    updateRequestStatus,
    addFunds,
    pendingRequests: moneyRequests.filter(req => req.requestStatus === "PENDING"),
    getRequestDetails
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
