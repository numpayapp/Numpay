import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../utils/axios';
import { useAuth } from '../context/AuthContext';

export interface ApiTransaction {
  id: string;
  txhash: string;
  transactionType: 'SEND' | 'RECEIVE' | 'DEPOSIT' | 'WITHDRAWAL';
  senderId: string;
  receiverId: string;
  amount: number;
  transactionStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  sender: {
    id: string;
    name: string | null;
    phoneNumber: string;
    walletAddress: string;
    privyDID: string;
    createdAt: string;
    deletedAt: string | null;
    status: string;
  };
  receiver: {
    id: string;
    name: string | null;
    phoneNumber: string;
    walletAddress: string;
    privyDID: string;
    createdAt: string;
    deletedAt: string | null;
    status: string;
  };
}

export interface Transaction {
  id: string;
  transactionType: 'send' | 'receive' | 'deposit' | 'withdrawal';
  amount: number;
  sender?: {
    id: string;
    name: string | null;
    phoneNumber: string;
    walletAddress: string;
  };
  receiver?: {
    id: string;
    name: string | null;
    phoneNumber: string;
    walletAddress: string;
  };
  timestamp: Date;
  completedAt?: Date;
  status: string;
  txhash: string;
}

const transformTransaction = (tx: ApiTransaction): Transaction => ({
  id: tx.id,
  txhash: tx.txhash,
  transactionType: tx.transactionType.toLowerCase() as Transaction['transactionType'],
  amount: tx.amount,
  receiver: {
    id: tx.receiver.id,
    name: tx.receiver.name,
    phoneNumber: tx.receiver.phoneNumber,
    walletAddress: tx.receiver.walletAddress,
  },
  sender: {
    id: tx.sender.id,
    name: tx.sender.name,
    phoneNumber: tx.sender.phoneNumber,
    walletAddress: tx.sender.walletAddress,
  },
  timestamp: new Date(tx.createdAt),
  completedAt: tx.completedAt ? new Date(tx.completedAt) : undefined,
  status: tx.transactionStatus.toLowerCase(),
});

export const useTransactions = (limit?: number) => {
  const { user } = useAuth();

  // Common query options for rate limiting
  const queryOptions = {
    enabled: !!user?.dbId,
    staleTime: 30 * 1000, // 30 seconds - data stays fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes - cache time
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnReconnect: false, // Don't refetch on network reconnect
    retry: 1, // Only retry once on failure
    retryDelay: 2000, // Wait 2 seconds before retry
  };

  const { data: sendData, isLoading: isSendLoading } = useQuery({
    queryKey: ['transactions', 'send', user?.dbId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<ApiTransaction[]>(
        `/api/transaction/user/${user?.dbId}?type=send`
      );
      return data.map(transformTransaction);
    },
    ...queryOptions,
  });

  const { data: receiveData, isLoading: isReceiveLoading } = useQuery({
    queryKey: ['transactions', 'receive', user?.dbId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<ApiTransaction[]>(
        `/api/transaction/user/${user?.dbId}?type=receive`
      );
      return data.map(transformTransaction);
    },
    ...queryOptions,
  });

  const { data: depositData, isLoading: isDepositLoading } = useQuery({
    queryKey: ['transactions', 'deposit', user?.dbId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<ApiTransaction[]>(
        `/api/transaction/user/${user?.dbId}?type=deposit`
      );
      return data.map(transformTransaction);
    },
    ...queryOptions,
  });

  const { data: withdrawalData, isLoading: isWithdrawalLoading } = useQuery({
    queryKey: ['transactions', 'withdrawal', user?.dbId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<ApiTransaction[]>(
        `/api/transaction/user/${user?.dbId}?type=withdrawal`
      );
      return data.map(transformTransaction);
    },
    ...queryOptions,
  });

  const allTransactions = [
    ...(sendData || []),
    ...(receiveData || []),
    ...(depositData || []),
    ...(withdrawalData || []),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const transactions = limit ? allTransactions.slice(0, limit) : allTransactions;

  return {
    transactions,
    isLoading: isSendLoading || isReceiveLoading || isDepositLoading || isWithdrawalLoading,
  };
}; 