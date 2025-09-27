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
          // Initialize World App user state
          setUser({
            isConnected: false, // Will be set to true after wallet connection
            isMiniApp: true,
            walletAddress: undefined, // Will be set after wallet auth
            username: undefined,
            profilePictureUrl: undefined,
          });
          console.log('World App (MiniKit) detected');
        } else {
          setUser({
            isConnected: false,
            isMiniApp: false,
          });
          console.log('Running in browser mode');
        }
      }
    };

    checkMiniKit();
  }, []);

  const connectWallet = async (): Promise<string | null> => {
    if (user.isMiniApp) {
      // For World App, use MiniKit wallet authentication
      try {
        console.log('Connecting wallet in World App...');

        // Use MiniKit to connect wallet
        const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
          nonce: Math.floor(Math.random() * 1000000).toString(),
          requestId: `connect-${Date.now()}`,
          expirationTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
          notBefore: new Date(),
          statement: "Connect your wallet to ViralForge to start creating and voting on memes!",
        });

        if (finalPayload.status === 'error') {
          throw new Error('Wallet authentication failed in World App');
        }

        const walletAddress = finalPayload.address;

        setUser(prev => ({
          ...prev,
          walletAddress,
          isConnected: true,
        }));

        console.log('World App wallet connected:', walletAddress);
        return walletAddress;
      } catch (error) {
        console.error('World App wallet connection failed:', error);
        setUser(prev => ({
          ...prev,
          isConnected: false,
        }));
        return null;
      }
    } else {
      // For browser, fallback to MetaMask
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          }) as string[];
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts returned');
          }
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
        console.error('Browser wallet connection failed:', error);
        return null;
      }
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