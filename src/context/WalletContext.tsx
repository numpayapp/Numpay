import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { showError, showSuccess } from "../lib/utils";
import { useSolanaBalance } from "../hooks/use-balance";
import { axiosInstance } from "../utils/axios";

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
  isBalanceLoading: boolean;
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

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const toE164Format = (phone: string): string => phone.replace(/\s+/g, "");

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { balance, isLoading: isBalanceLoading, refetch: refetchBalance } = useSolanaBalance();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [moneyRequests, setMoneyRequests] = useState<MoneyRequest[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem("wallet_transactions");
      if (stored) {
        setTransactions(JSON.parse(stored).map((tx: Transaction) => ({ ...tx })));
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("wallet_transactions", JSON.stringify(transactions));
    }
  }, [transactions, user]);

  const sendMoney = async (amount: number, recipient: string): Promise<boolean> => {
    try {
      if (amount <= 0) throw new Error("Amount must be greater than 0");
      if (amount > balance) throw new Error("Insufficient funds");

      const response = await axiosInstance.post("/api/transaction/execute-transfer", {
        recipientPhone: recipient,
        amount,
      });

      if (!response.data.success) throw new Error("Transfer failed");

      const txHash: string = response.data.txhash;
      setTransactions(prev => [{
        txhash: txHash,
        type: "send",
        amount,
        recipient,
        status: "completed",
      }, ...prev]);

      await refetchBalance();
      showSuccess("Money sent!", `You sent $${amount.toFixed(2)} to ${recipient}`);
      return true;
    } catch (error: any) {
      showError("Send money failed", error?.response?.data?.message || error?.message || "Failed to send money");
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
      if (amount <= 0) throw new Error("Amount must be greater than 0");

      let response;
      if (requestType === "GLOBAL") {
        response = await axiosInstance.post("/api/request/global", {
          requesterId: user?.dbId,
          amountRequested: amount,
          message,
        });
      } else {
        const e164Phone = toE164Format(from);
        let payerId = "";
        try {
          const resp = await axiosInstance.get(`/api/user/phone/${encodeURIComponent(e164Phone)}`);
          payerId = resp.data.id;
        } catch (e: any) {
          if (e.response?.status === 404) {
            const createResp = await axiosInstance.post("/api/user/pregenerate", { phoneNumber: e164Phone });
            payerId = createResp.data.id;
          } else throw e;
        }

        response = await axiosInstance.post("/api/request/", {
          requesterId: user?.dbId,
          payerId,
          payerPhone: e164Phone,
          amountRequested: amount,
          message,
          requestType: "DIRECT",
        });
      }

      const newRequest: MoneyRequest = {
        ...response.data,
        requestDate: new Date(response.data.requestDate),
      };
      setMoneyRequests(prev => [newRequest, ...prev]);

      showSuccess("Request sent!", `You have requested $${amount.toFixed(2)} ${requestType === "DIRECT" ? `from ${from}` : ""}`);
      return { success: true, requestId: response.data.requestId };
    } catch (error: any) {
      showError("Request money failed", error?.response?.data?.error || "Failed to request money");
      return { success: false };
    }
  };

  const cancelRequest = async (requestId: string): Promise<boolean> => {
    try {
      await axiosInstance.post(`/api/request/cancel/${requestId}`);
      setMoneyRequests(prev => prev.map(req => req.id === requestId ? { ...req, requestStatus: "CANCELED" } : req));
      showSuccess("Request cancelled", "Money request has been cancelled successfully");
      return true;
    } catch (error: any) {
      showError("Failed to cancel request", error?.message || "Could not cancel the request");
      return false;
    }
  };

  const updateRequestStatus = async (
    requestId: string,
    status: "CANCELED" | "APPROVED" | "REJECTED" | "PENDING"
  ): Promise<boolean> => {
    try {
      await axiosInstance.put(`/api/request/update-status/${requestId}`, { status });
      setMoneyRequests(prev => prev.map(req => req.id === requestId ? { ...req, requestStatus: status } : req));
      showSuccess("Request updated", `Request has been ${status.toLowerCase()} successfully`);
      return true;
    } catch (error: any) {
      showError("Failed to update request", error?.message || "Could not update the request status");
      return false;
    }
  };

  useEffect(() => {
    if (user?.dbId) {
      axiosInstance.get(`/api/request/get/all/${user.dbId}`)
        .then(response => {
          setMoneyRequests(response.data.map((req: MoneyRequest) => ({
            ...req,
            requestDate: new Date(req.requestDate) || new Date(),
          })));
        })
        .catch(error => console.error("Error fetching money requests:", error));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.dbId]);

  const addFunds = async (_amount: number, _method: "card" | "apple_pay" | "google_pay"): Promise<boolean> => {
    showError("Coming soon", "Direct card funding for Solana is coming soon. Please deposit USDC to your wallet address.");
    return false;
  };

  const getRequestDetails = async (requestId: string): Promise<MoneyRequest | null> => {
    try {
      const response = await axiosInstance.get(`/api/request/get/${requestId}`);
      if (!response.data) return null;
      return {
        ...response.data,
        requestDate: new Date(response.data.requestDate),
        requester: {
          name: response.data.requester?.name || null,
          phoneNumber: response.data.requester?.phoneNumber || response.data.requesterPhone,
        },
      };
    } catch (error) {
      console.error("Error fetching request details:", error);
      return null;
    }
  };

  const value: WalletContextType = {
    balance,
    isBalanceLoading,
    transactions,
    moneyRequests,
    sendMoney,
    requestMoney,
    cancelRequest,
    updateRequestStatus,
    addFunds,
    pendingRequests: moneyRequests.filter(req => req.requestStatus === "PENDING"),
    getRequestDetails,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) throw new Error("useWallet must be used within a WalletProvider");
  return context;
};
