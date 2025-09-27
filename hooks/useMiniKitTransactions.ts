"use client";

import { MiniKit } from '@worldcoin/minikit-js';
import { Contract } from 'ethers';
import { CONTRACT_ABI, DEPLOYED_CONTRACT } from '@/lib/ethers';

export function useMiniKitTransactions() {

  const sendVoteTransaction = async (
    userAddress: string,
    marketId: number,
    voteYes: boolean
  ) => {
    if (!MiniKit.isInstalled()) {
      throw new Error('MiniKit not available - use fallback method');
    }

    try {
      const voteCost = "100000000000000"; // 0.0001 ETH in wei

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{
          address: DEPLOYED_CONTRACT,
          abi: CONTRACT_ABI,
          functionName: 'vote',
          args: [userAddress, marketId, voteYes],
          value: voteCost,
        }],
      });

      if (finalPayload.status === 'error') {
        throw new Error('Transaction failed');
      }

      return finalPayload.transaction_id;
    } catch (error) {
      console.error('MiniKit vote transaction failed:', error);
      throw error;
    }
  };

  const sendCreateMemeTransaction = async (
    creator: string,
    cid: string,
    templateId: number
  ) => {
    if (!MiniKit.isInstalled()) {
      throw new Error('MiniKit not available - use fallback method');
    }

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{
          address: DEPLOYED_CONTRACT,
          abi: CONTRACT_ABI,
          functionName: 'createMeme',
          args: [creator, cid, templateId],
        }],
      });

      if (finalPayload.status === 'error') {
        throw new Error('Transaction failed');
      }

      return finalPayload.transaction_id;
    } catch (error) {
      console.error('MiniKit create meme transaction failed:', error);
      throw error;
    }
  };

  const sendCreateMarketTransaction = async (metadata: string) => {
    if (!MiniKit.isInstalled()) {
      throw new Error('MiniKit not available - use fallback method');
    }

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{
          address: DEPLOYED_CONTRACT,
          abi: CONTRACT_ABI,
          functionName: 'createMarket',
          args: [metadata],
        }],
      });

      if (finalPayload.status === 'error') {
        throw new Error('Transaction failed');
      }

      return finalPayload.transaction_id;
    } catch (error) {
      console.error('MiniKit create market transaction failed:', error);
      throw error;
    }
  };

  return {
    sendVoteTransaction,
    sendCreateMemeTransaction,
    sendCreateMarketTransaction,
  };
}