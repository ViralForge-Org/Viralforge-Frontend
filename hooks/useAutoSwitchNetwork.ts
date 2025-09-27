"use client";

import { useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { worldChainTestnet } from '@/config/wagmiConfig';

export function useAutoSwitchNetwork() {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    const autoSwitchToWorldChain = async () => {
      // Only auto-switch in browser mode when wallet is connected
      if (isConnected && chainId && chainId !== worldChainTestnet.id) {
        try {
          console.log(`Current chain: ${chainId}, switching to World Chain Sepolia (${worldChainTestnet.id})`);

          // Switch to World Chain Sepolia
          await switchChain({ chainId: worldChainTestnet.id });

          console.log('Successfully switched to World Chain Sepolia');
        } catch (error: any) {
          console.error('Failed to switch to World Chain Sepolia:', error);

          // If the chain is not added to wallet, request to add it
          if (error?.code === 4902 && window.ethereum) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${worldChainTestnet.id.toString(16)}`,
                  chainName: worldChainTestnet.name,
                  nativeCurrency: worldChainTestnet.nativeCurrency,
                  rpcUrls: worldChainTestnet.rpcUrls.default.http,
                  blockExplorerUrls: [worldChainTestnet.blockExplorers?.default.url],
                }],
              });

              // After adding, try to switch again
              await switchChain({ chainId: worldChainTestnet.id });
              console.log('Added and switched to World Chain Sepolia');
            } catch (addError) {
              console.error('Failed to add World Chain Sepolia to wallet:', addError);
            }
          }
        }
      }
    };

    // Small delay to ensure wallet is fully connected
    if (isConnected) {
      const timeoutId = setTimeout(autoSwitchToWorldChain, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, chainId, switchChain]);

  return {
    currentChainId: chainId,
    isWorldChain: chainId === worldChainTestnet.id,
    targetChainId: worldChainTestnet.id,
  };
}