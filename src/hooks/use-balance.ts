import { useState, useEffect, useCallback } from 'react';
import { axiosInstance } from '../utils/axios';
import { useAuth } from '../context/AuthContext';

export function useSolanaBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!user?.privyDID) return;
    try {
      setIsLoading(true);
      const { data } = await axiosInstance.get(`/api/user/balance/${encodeURIComponent(user.privyDID)}`);
      setBalance(data.balance ?? 0);
    } catch (error) {
      console.error('Error fetching Solana USDC balance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.privyDID]);

  useEffect(() => {
    fetchBalance();
    const id = setInterval(fetchBalance, 15_000);
    return () => clearInterval(id);
  }, [fetchBalance]);

  return { balance, isLoading, refetch: fetchBalance };
}

// Keep old export name so WalletContext still works during transition
export function useSmartWalletBalance() {
  const { balance } = useSolanaBalance();
  return balance;
}
