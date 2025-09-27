"use client";

import { MiniKit } from '@worldcoin/minikit-js';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ABI, DEPLOYED_CONTRACT } from '@/lib/ethers';
import { parseEther } from 'viem';
import { useState } from 'react';

export function useTransactions() {
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const [pendingTx, setPendingTx] = useState<string | null>(null);

  const isMiniApp = typeof window !== 'undefined' && MiniKit.isInstalled();

  // Clear pending transaction
  const clearPendingTx = () => setPendingTx(null);

  // Create meme transaction
  const createMeme = async (creator: string, cid: string, templateId: number) => {
    try {
      console.log('Creating meme:', { creator, cid, templateId });

      if (isMiniApp) {
        // Use MiniKit for World App
        const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
          transaction: [{
            address: DEPLOYED_CONTRACT,
            abi: CONTRACT_ABI,
            functionName: 'createMeme',
            args: [creator, cid, templateId],
          }],
        });

        if (finalPayload.status === 'error') {
          throw new Error('Transaction failed in World App');
        }

        setPendingTx(finalPayload.transaction_id);
        return finalPayload.transaction_id;
      } else {
        // Use Wagmi for browser
        if (!isConnected || !address) {
          throw new Error('Please connect your wallet first');
        }

        writeContract({
          address: DEPLOYED_CONTRACT as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'createMeme',
          args: [creator as `0x${string}`, cid, BigInt(templateId)],
        });

        // Return success indication - the actual hash tracking is handled by the hook
        return 'pending';
      }
    } catch (error) {
      console.error('Create meme error:', error);
      throw error;
    }
  };

  // Vote transaction
  const vote = async (userAddress: string, marketId: number, voteYes: boolean) => {
    try {
      console.log('Voting:', { userAddress, marketId, voteYes });
      const voteCost = parseEther("0.0001");

      if (isMiniApp) {
        // Use MiniKit for World App
        const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
          transaction: [{
            address: DEPLOYED_CONTRACT,
            abi: CONTRACT_ABI,
            functionName: 'vote',
            args: [userAddress, marketId, voteYes],
            value: voteCost.toString(),
          }],
        });

        if (finalPayload.status === 'error') {
          throw new Error('Transaction failed in World App');
        }

        setPendingTx(finalPayload.transaction_id);
        return finalPayload.transaction_id;
      } else {
        // Use Wagmi for browser
        if (!isConnected || !address) {
          throw new Error('Please connect your wallet first');
        }

        writeContract({
          address: DEPLOYED_CONTRACT as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'vote',
          args: [userAddress as `0x${string}`, BigInt(marketId), voteYes],
          value: voteCost,
        });

        return 'pending';
      }
    } catch (error) {
      console.error('Vote error:', error);
      throw error;
    }
  };

  // Create market transaction
  const createMarket = async (metadata: string) => {
    try {
      console.log('Creating market:', { metadata });

      if (isMiniApp) {
        // Use MiniKit for World App
        const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
          transaction: [{
            address: DEPLOYED_CONTRACT,
            abi: CONTRACT_ABI,
            functionName: 'createMarket',
            args: [metadata],
          }],
        });

        if (finalPayload.status === 'error') {
          throw new Error('Transaction failed in World App');
        }

        setPendingTx(finalPayload.transaction_id);
        return finalPayload.transaction_id;
      } else {
        // Use Wagmi for browser
        if (!isConnected || !address) {
          throw new Error('Please connect your wallet first');
        }

        writeContract({
          address: DEPLOYED_CONTRACT as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'createMarket',
          args: [metadata],
        });

        return 'pending';
      }
    } catch (error) {
      console.error('Create market error:', error);
      throw error;
    }
  };

  return {
    createMeme,
    vote,
    createMarket,
    pendingTx,
    clearPendingTx,
    isMiniApp,
    isConnected: isMiniApp || isConnected,
    userAddress: address,
  };
}