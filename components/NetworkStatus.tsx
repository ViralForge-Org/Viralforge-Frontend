"use client";

import { useWorldApp } from '@/hooks/useWorldApp';
import { worldChainTestnet } from '@/config/wagmiConfig';

export function NetworkStatus() {
  const { isMiniApp, isWorldChain, currentChainId } = useWorldApp();

  if (isMiniApp) {
    return (
      <div className="fixed top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium z-50">
        🌍 World App
      </div>
    );
  }

  if (!currentChainId) {
    return null;
  }

  if (isWorldChain) {
    return (
      <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium z-50">
        ⛓️ World Chain Sepolia
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium z-50">
      ⚠️ Wrong Network ({currentChainId})
    </div>
  );
}