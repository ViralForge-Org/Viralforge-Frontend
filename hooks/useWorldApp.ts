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
      throw new Error('MiniKit is not ready. Please wait for initialization.');
    }

    if (user.isMiniApp) {
      // For World App, use MiniKit wallet authentication
      try {
        console.log('🔐 Connecting wallet in World App...');

        // Generate a secure nonce (at least 8 alphanumeric characters as per docs)
        const generateSecureNonce = (): string => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let result = '';
          for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return result;
        };

        const nonce = generateSecureNonce();
        console.log('🔑 Generated nonce for authentication');

        // Use MiniKit to connect wallet with proper error handling
        const response = await MiniKit.commandsAsync.walletAuth({
          nonce,
          requestId: `viralforge-${Date.now()}`,
          expirationTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
          notBefore: new Date(),
          statement: "Connect your wallet to ViralForge to start creating and voting on memes!",
        });

        console.log('📡 Received wallet auth response:', response);

        if (!response || !response.finalPayload) {
          throw new Error('No response received from wallet authentication');
        }

        const { finalPayload } = response;

        if (finalPayload.status === 'error') {
          console.error('❌ Wallet authentication error:', finalPayload.error_code);
          throw new Error(`Wallet authentication failed: ${finalPayload.error_code || 'Unknown error'}`);
        }

        if (!finalPayload.address) {
          throw new Error('No wallet address received from authentication');
        }

        const walletAddress = finalPayload.address;

        // Update user state with wallet info
        setUser(prev => ({
          ...prev,
          walletAddress,
          isConnected: true,
          username: (finalPayload as any).username || prev.username,
        }));

        console.log('✅ World App wallet connected successfully:', walletAddress);

        // Also log user data if available
        if (MiniKit.user) {
          console.log('👤 User info:', {
            username: MiniKit.user.username,
            address: walletAddress
          });
        }

        return walletAddress;
      } catch (error) {
        console.error('❌ World App wallet connection failed:', error);
        setUser(prev => ({
          ...prev,
          isConnected: false,
          walletAddress: undefined,
        }));

        // Re-throw the error with more context
        throw new Error(`Wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Not running in World App, provide clear instructions
      const message = '🌍 This app requires World App to connect your wallet.\n\nPlease:\n1. Install World App on your device\n2. Open this app through World App to connect your wallet\n3. Try the wallet connection again';
      console.log('⚠️ Not running in World App environment');
      throw new Error('App must be opened in World App to connect wallet');
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