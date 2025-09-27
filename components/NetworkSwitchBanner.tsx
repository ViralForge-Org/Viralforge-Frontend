"use client";

import { useWorldApp } from '@/hooks/useWorldApp';
import { useSwitchChain } from 'wagmi';
import { worldChainTestnet } from '@/config/wagmiConfig';

export function NetworkSwitchBanner() {
  const { isMiniApp, isWorldChain, currentChainId } = useWorldApp();
  const { switchChain } = useSwitchChain();

  // Don't show banner in mini app or if already on correct network
  if (isMiniApp || isWorldChain || !currentChainId) {
    return null;
  }

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: worldChainTestnet.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <div className="bg-yellow-500 text-black px-4 py-3 text-center relative">
      <div className="flex items-center justify-center gap-4">
        <span className="font-medium">
          ⚠️ Please switch to World Chain Sepolia to use ViralForge
        </span>
        <button
          onClick={handleSwitchNetwork}
          className="bg-black text-yellow-500 px-4 py-1 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Switch Network
        </button>
      </div>
    </div>
  );
}