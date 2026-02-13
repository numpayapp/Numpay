/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, Hex, http, PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from '@zerodev/sdk';
import { useSignAuthorization } from '@privy-io/react-auth';
import { KERNEL_V3_3_BETA, getEntryPoint, KernelVersionToAddressesMap } from '@zerodev/sdk/constants';
import { base, baseSepolia } from 'viem/chains';

const chain = base;
const kernelVersion = KERNEL_V3_3_BETA;
const bundlerRpc = import.meta.env.VITE_APP_ZERODEV_RPC as string;
const paymasterRpc = import.meta.env.VITE_APP_ZERODEV_RPC as string;
const entryPoint = getEntryPoint("0.7");
const sponsorKey = import.meta.env.VITE_APP_7702_SPONSOR_KEY as Hex | undefined;

const publicClient = createPublicClient({
  chain,
  transport: http(),
}) as any;

export const useCreateKernel = () => {
  const { wallets, ready: walletsReady } = useWallets();
  const [kernelData, setKernelData] = useState<{
    kernelClient: any;
    address: string | null;
    loading: boolean;
    error: string | null;
  }>({
    kernelClient: null,
    address: null,
    loading: true,
    error: null,
  });

  const { signAuthorization } = useSignAuthorization();

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000;

    const init = async () => {
      if (!walletsReady) return;

      try {
        const embedded = wallets.find(w => w.walletClientType === 'privy');
        if (!embedded) {
          if (isMounted) {
            setKernelData(prev => ({
              ...prev,
              loading: false,
              error: 'No embedded Privy wallet found',
            }));
          }
          return;
        }

        const walletClient = createWalletClient({
          account: embedded.address as Hex,
          chain,
          transport: custom(await embedded.getEthereumProvider()),
        });

        const authorization = await signAuthorization({
          contractAddress: KernelVersionToAddressesMap[kernelVersion].accountImplementationAddress,
          chainId: chain.id,
        });

        const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
          signer: walletClient,
          entryPoint,
          kernelVersion,
        });

        const kernelAccount = await createKernelAccount(publicClient, {
          plugins: { sudo: ecdsaValidator },
          entryPoint,
          kernelVersion,
          address: walletClient.account.address,
          eip7702Auth: authorization,
          ...(sponsorKey ? { eip7702SponsorAccount: privateKeyToAccount(sponsorKey) } : {}),
        });

        const paymasterClient = createZeroDevPaymasterClient({
          chain,
          transport: http(paymasterRpc),
        });

        const kernelClient = createKernelAccountClient({
          account: kernelAccount,
          chain,
          bundlerTransport: http(bundlerRpc),
          paymaster: paymasterClient,
          client: publicClient,
        });

        const address = await kernelClient.account.getAddress();

        if (isMounted) {
          setKernelData({ kernelClient, address, loading: false, error: null });
        }
      } catch (error: any) {
        console.error('Error initializing kernel client:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => isMounted && init(), retryDelay);
          return;
        }
        if (isMounted) {
          setKernelData(prev => ({ ...prev, loading: false, error: error.message || 'Initialization failed' }));
        }
      }
    };

    init();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletsReady, wallets.length]);

  return kernelData;
};
