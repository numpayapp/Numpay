import { useState, useEffect } from 'react';
import { useCreateKernel } from './use-create-kernel';      
import { publicClient } from '../lib/utils';
import { USDC_ADDRESS } from '../utils/constants';
import { erc20Abi } from 'viem';

let balanceCache = {
  balance: 0n,
  timestamp: 0,
  address: '',
};

const CACHE_DURATION = 10000;

export function useSmartWalletBalance() {
  const kernelClient = useCreateKernel();
  const [balanceWei, setBalanceWei] = useState<bigint>(0n);

  useEffect(() => {
    if (!kernelClient || !kernelClient.kernelClient || kernelClient.loading || !kernelClient.address) return;
    let cancelled = false;

    const fetchBalance = async () => {
      try {
        const address = kernelClient.address;
        const currentTime = Date.now();

        if (
          balanceCache.address === address &&
          currentTime - balanceCache.timestamp < CACHE_DURATION
        ) {
          if (!cancelled) {
            setBalanceWei(balanceCache.balance);
          }
          return;
        }

        const bal = await (publicClient as any).readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });

        balanceCache = {
          balance: bal,
          timestamp: currentTime,
          address,
        };

        if (!cancelled) {
          setBalanceWei(bal);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchBalance();

    const intervalId = setInterval(fetchBalance, CACHE_DURATION);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [kernelClient]);

  return balanceWei;
}
