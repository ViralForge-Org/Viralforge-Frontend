"use client";

import { MiniKit } from '@worldcoin/minikit-js';
import { useState, useEffect } from 'react';
import { useAutoSwitchNetwork } from './useAutoSwitchNetwork';

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

  useEffect(() => {
    const checkMiniKit = async () => {
      if (typeof window !== 'undefined') {
        const isMiniApp = MiniKit.isInstalled();

        if (isMiniApp) {
          // Get user information from World App
          try {
            // Note: In real implementation, you'd use wallet auth
            setUser({
              isConnected: true,
              isMiniApp: true,
              walletAddress: undefined, // Will be set after auth
              username: undefined,
              profilePictureUrl: undefined,
            });
          } catch (error) {
            console.error('Error getting user info:', error);
            setUser({
              isConnected: false,
              isMiniApp: true,
            });
          }
        } else {
          setUser({
            isConnected: false,
            isMiniApp: false,
          });
        }
      }
    };

    checkMiniKit();
  }, []);

  const connectWallet = async (): Promise<string | null> => {
    if (user.isMiniApp) {
      // For mini app, implement wallet auth
      try {
        // TODO: Implement MiniKit wallet authentication
        console.log('Mini app wallet connection - implement wallet auth');
        return null;
      } catch (error) {
        console.error('Mini app wallet connection failed:', error);
        return null;
      }
    } else {
      // For browser, fallback to MetaMask
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
          const address = accounts[0];
          setUser(prev => ({
            ...prev,
            walletAddress: address,
            isConnected: true,
          }));
          return address;
        }
        return null;
      } catch (error) {
        console.error('Wallet connection failed:', error);
        return null;
      }
    }
  };

  return {
    user,
    connectWallet,
    isMiniApp: user.isMiniApp,
    isConnected: user.isConnected,
    isWorldChain,
    currentChainId,
  };
}