"use client";

import { MiniKit } from '@worldcoin/minikit-js';
import { useState, useEffect } from 'react';
import { useAutoSwitchNetwork } from './useAutoSwitchNetwork';
import { useMiniKit } from '@/components/MiniKitProvider';

interface WorldAppUser {
  walletAddress?: string;
  username?: string;
  profilePictureUrl?: string;
  isConnected: boolean;
  isMiniApp: boolean;
}

export function useWorldApp() {
  const [user, setUser] = useState<WorldAppUser>({
    isConnected: false,
    isMiniApp: false,
  });

  // Auto-switch to World Chain in browser mode
  const { isWorldChain, currentChainId } = useAutoSwitchNetwork();

  // Use the MiniKit context to check if it's installed
  const { isInstalled: isMiniAppInstalled, isReady } = useMiniKit();

  useEffect(() => {
    if (isReady) {
      if (isMiniAppInstalled) {
        // Initialize World App user state
        setUser({
          isConnected: false, // Will be set to true after wallet connection
          isMiniApp: true,
          walletAddress: undefined, // Will be set after wallet auth
          username: undefined,
          profilePictureUrl: undefined,
        });
        console.log('✅ World App (MiniKit) detected and ready');
      } else {
        setUser({
          isConnected: false,
          isMiniApp: false,
        });
        console.log('⚠️ Running in browser mode - MiniKit not available');
      }
    }
  }, [isReady, isMiniAppInstalled]);

  const connectWallet = async (): Promise<string | null> => {
    if (!isReady) {
      console.log('⏳ MiniKit is not ready yet. Please wait...');
      return null;
    }

    if (user.isMiniApp) {
      // For World App, use MiniKit wallet authentication
      try {
        console.log('🔐 Connecting wallet in World App...');

        // Generate a secure nonce (should ideally come from backend)
        const nonce = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

        // Use MiniKit to connect wallet
        const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
          nonce,
          requestId: `viralforge-${Date.now()}`,
          expirationTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
          notBefore: new Date(),
          statement: "Connect your wallet to ViralForge to start creating and voting on memes!",
        });

        if (finalPayload.status === 'error') {
          console.error('❌ Wallet authentication error:', finalPayload.error_code);
          throw new Error(`Wallet authentication failed: ${finalPayload.error_code}`);
        }

        const walletAddress = finalPayload.address;

        setUser(prev => ({
          ...prev,
          walletAddress,
          isConnected: true,
        }));

        console.log('✅ World App wallet connected:', walletAddress);
        return walletAddress;
      } catch (error) {
        console.error('❌ World App wallet connection failed:', error);
        setUser(prev => ({
          ...prev,
          isConnected: false,
        }));
        return null;
      }
    } else {
      // Not running in World App, show message
      console.log('⚠️ Please open this app in World App to connect your wallet');
      alert('🌍 This app is designed to work with World App.\n\nPlease:\n1. Install World App on your device\n2. Open this app through World App to connect your wallet');
      return null;
    }
  };

  const disconnectWallet = () => {
    setUser(prev => ({
      ...prev,
      walletAddress: undefined,
      isConnected: false,
    }));
    console.log('Wallet disconnected');
  };

  return {
    user,
    connectWallet,
    disconnectWallet,
    isMiniApp: user.isMiniApp,
    isConnected: user.isConnected,
    walletAddress: user.walletAddress,
    isWorldChain,
    currentChainId,
  };
}