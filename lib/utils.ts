import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MemeTemplate } from "./memes";
import lighthouse from '@lighthouse-web3/sdk' 
import { parseEther } from "ethers";
import { writeContract, waitForTransactionReceipt, readContract, simulateContract } from '@wagmi/core';
import { config } from "@/config/wagmiConfig";
import { CONTRACT_ABI, DEPLOYED_CONTRACT } from "@/lib/ethers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_ROUTE =
  process.env.NEXT_PUBLIC_PROD == "False" ? "http://localhost:5000" : "http://localhost:5000";

// lib/api.ts
interface MemeData {
  address: string,
  cid: string;
  templateId: string
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const createMeme = async (memeData: MemeData): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_ROUTE}/api/meme`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memeData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create meme");
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error creating meme:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export const getAllMemes = async ()  => {
  try {
    const response = await fetch(`${API_ROUTE}/api/memes`);

    const data: MemeTemplate[] = await response.json();
    
    if (!response.ok) {
      throw new Error("Failed to create meme");
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error creating meme:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export const uploadImage = async (base64: string) => {
  const API_KEY = process.env.NEXT_PUBLIC_LIGHTHOPUSE_GATEWAY;
  const response = await lighthouse.uploadText(base64, API_KEY || "");

  return response.data.Hash;
}

// FIXED: Enhanced investInTemplate with proper type handling and error management
// lib/utils.ts - Updated investInTemplate function with vote tracking

// Add this new function to check if user has voted
export const hasUserVoted = async (userAddress: string, marketId: number): Promise<boolean> => {
  try {
    // For now, just check local storage as we can't easily simulate the contract call
    // The contract will handle the actual verification
    const voteKey = `user_vote_${userAddress}_${marketId}`;
    const localVote = localStorage.getItem(voteKey);
    return localVote !== null;
  } catch (error) {
    console.warn("Could not check voting status:", error);
    return false; // Assume user hasn't voted if check fails
  }
};

// Utility function to clear all voting data for debugging
export const clearAllVotingData = (userAddress?: string) => {
  const keys = Object.keys(localStorage);
  const voteKeys = keys.filter(key => 
    key.includes('user_vote_') || 
    key.includes('voted_meme_') || 
    key.includes('vote_tx_')
  );
  
  if (userAddress) {
    // Clear only for specific user
    const userKeys = voteKeys.filter(key => key.includes(userAddress));
    userKeys.forEach(key => {
      console.log(`🗑️ Clearing: ${key}`);
      localStorage.removeItem(key);
    });
    console.log(`✅ Cleared ${userKeys.length} vote records for user ${userAddress}`);
  } else {
    // Clear all voting data
    voteKeys.forEach(key => {
      console.log(`🗑️ Clearing: ${key}`);
      localStorage.removeItem(key);
    });
    console.log(`✅ Cleared ${voteKeys.length} total vote records`);
  }
};

export const investInTemplate = async (
  userAddress: string,
  marketId: number,
  voteYes: boolean,
  memeCid?: string
): Promise<ApiResponse> => {
  try {
    console.log(`User ${userAddress} voting ${voteYes ? 'Funny' : 'Lame'} on market ${marketId}`);

    // Validate inputs
    if (!userAddress || !userAddress.startsWith('0x')) {
      throw new Error('Invalid user address');
    }

    if (marketId < 0 || !Number.isInteger(marketId)) {
      throw new Error('Invalid market ID');
    }

    const voteCost = parseEther("0.0001"); // 0.0001 ETH
    const wagmiConfig = config as any;

    // **NEW: Pre-flight checks to debug the issue**
    try {
      console.log("🔍 Performing pre-flight checks...");
      
      // Check market count
      const marketCount = await readContract(wagmiConfig, {
        address: DEPLOYED_CONTRACT as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "marketCount",
      }) as bigint;
      console.log(`📊 Market count: ${marketCount}`);
      
      if (BigInt(marketId) >= marketCount) {
        throw new Error(`Market ${marketId} does not exist. Only ${Number(marketCount)} markets available.`);
      }

      // Check market data
      const marketData = await readContract(wagmiConfig, {
        address: DEPLOYED_CONTRACT as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "getMarket",
        args: [BigInt(marketId)],
      });
      
      const [creator, endTime, yesVotes, noVotes, totalStaked, isActive, metadata] = marketData as any[];
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeft = Number(endTime) - currentTime;
      
      console.log(`🏪 Market ${marketId} detailed data:`, {
        creator,
        endTime: Number(endTime),
        endTimeFormatted: new Date(Number(endTime) * 1000).toISOString(),
        currentTime,
        currentTimeFormatted: new Date(currentTime * 1000).toISOString(),
        timeLeft,
        timeLeftHours: Math.floor(timeLeft / 3600),
        timeLeftMinutes: Math.floor((timeLeft % 3600) / 60),
        yesVotes: Number(yesVotes),
        noVotes: Number(noVotes),
        totalStaked: Number(totalStaked),
        isActive,
        metadata
      });

      // Additional checks with more specific error messages
      console.log(`💰 Vote cost check: required = ${voteCost.toString()}, sending = ${voteCost.toString()}`);
      
      // Check vote cost (this might be the issue)
      const contractVoteCost = await readContract(wagmiConfig, {
        address: DEPLOYED_CONTRACT as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "voteCost",
      }) as bigint;
      
      console.log(`⚖️ Contract vote cost: ${contractVoteCost.toString()}, our vote cost: ${voteCost.toString()}`);
      
      if (voteCost !== contractVoteCost) {
        throw new Error(`Vote cost mismatch! Contract expects ${contractVoteCost.toString()} wei, but sending ${voteCost.toString()} wei`);
      }

      if (!isActive) {
        throw new Error(`Market ${marketId} is not active`);
      }

      if (Number(endTime) <= Math.floor(Date.now() / 1000)) {
        throw new Error(`Market ${marketId} voting period has ended`);
      }

      // NEW: Check if user has already voted by checking local storage first
      const voteKey = memeCid ? `user_vote_${userAddress}_meme_${memeCid}` : `user_vote_${userAddress}_${marketId}`;
      const simpleMemeKey = memeCid ? `voted_meme_${memeCid}` : null;
      
      const localVote = localStorage.getItem(voteKey);
      const simpleMemeVote = simpleMemeKey ? localStorage.getItem(simpleMemeKey) : null;
      
      if (localVote || simpleMemeVote) {
        throw new Error(`You have already voted on this ${memeCid ? 'meme' : 'market'}`);
      }

      // NEW: Additional debugging - check if this might be a "hasVoted" issue
      console.log("🔍 Checking all user vote keys in localStorage...");
      const allKeys = Object.keys(localStorage).filter(key => 
        key.includes(userAddress) || key.includes('voted')
      );
      console.log("📋 Found vote-related keys:", allKeys);
      
      // Check specific keys for this user/market combination
      const marketVoteKeys = [
        `user_vote_${userAddress}_${marketId}`,
        `user_vote_${userAddress}_meme_${memeCid}`,
        `voted_meme_${memeCid}`,
        `vote_tx_${userAddress}_${marketId}`,
        `vote_tx_${userAddress}_meme_${memeCid}`
      ];
      
      marketVoteKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          console.log(`🗝️ Found existing vote: ${key} = ${value}`);
        }
      });

      // NEW: Try to simulate the contract call to catch "already voted" errors
      console.log("🧪 Testing vote transaction with simulation...");
      try {
        await simulateContract(wagmiConfig, {
          address: DEPLOYED_CONTRACT as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'vote',
          args: [userAddress as `0x${string}`, BigInt(marketId), voteYes],
          value: voteCost,
          account: userAddress as `0x${string}`,
        });
        console.log("✅ Simulation successful, proceeding with vote...");
      } catch (simulationError: any) {
        console.error("❌ Simulation failed:", simulationError);
        
        // Check for specific error messages
        const errorMessage = simulationError.message || simulationError.toString();
        
        if (errorMessage.includes('already voted') || errorMessage.includes('You have already voted')) {
          throw new Error(`You have already voted on this market. Please check the blockchain state.`);
        }
        
        if (errorMessage.includes('Voting period ended')) {
          throw new Error(`The voting period for this market has ended`);
        }
        
        if (errorMessage.includes('Incorrect voting fee')) {
          throw new Error(`Incorrect voting fee - expected ${contractVoteCost.toString()} wei`);
        }
        
        if (errorMessage.includes('Market is not active')) {
          throw new Error(`This market is no longer active`);
        }
        
        // Since the simulation fails with "unknown reason", it's likely you've already voted
        // but the contract isn't giving us the specific error message
        if (errorMessage.includes('Execution reverted for an unknown reason') || 
            errorMessage.includes('execution reverted')) {
          throw new Error(`Transaction failed: You have likely already voted on this market. The blockchain shows you cannot vote again.`);
        }
        
        // For other simulation errors, throw the original error
        throw new Error(`Transaction would fail: ${errorMessage}`);
      }

      console.log("✅ Pre-flight checks passed, proceeding with vote...");
      
    } catch (preflightError) {
      console.error("❌ Pre-flight check failed:", preflightError);
      throw preflightError;
    }

    // Execute the vote transaction - let wallet handle gas estimation to avoid RPC issues
    console.log("🚀 Executing vote transaction...");
    
    // Add small delay after simulation to avoid timing issues
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const hash = await writeContract(wagmiConfig, {
      address: DEPLOYED_CONTRACT as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'vote',
      args: [userAddress as `0x${string}`, BigInt(marketId), voteYes],
      value: voteCost,
      // Let wallet handle gas estimation completely
    }).catch(async (error) => {
      console.error("🔥 Transaction failed, trying with manual gas estimation...", error);
      
      // Fallback: Try with basic gas limit only
      return await writeContract(wagmiConfig, {
        address: DEPLOYED_CONTRACT as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'vote',
        args: [userAddress as `0x${string}`, BigInt(marketId), voteYes],
        value: voteCost,
        gas: BigInt(300000), // Higher gas limit for problematic networks
      });
    });

    console.log("Vote transaction submitted:", hash);

    // Wait for transaction confirmation
    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash: hash,
    });

    console.log("Vote confirmed:", receipt);

    // **NEW: Track the vote in our database**
    try {
      await fetch(`${API_ROUTE}/api/user-vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          marketId,
          vote: voteYes ? 'funny' : 'lame',
          transactionHash: hash,
          memeCid: memeCid // Include meme CID for per-meme tracking
        })
      });
      
      console.log("Vote tracked in database");
    } catch (trackingError) {
      console.warn("Failed to track vote in database:", trackingError);
      // Don't fail the whole transaction for tracking errors
    }

    // **NEW: Store vote locally as well (backup)**
    // If memeCid is provided, track per meme, otherwise fallback to per market
    const voteKey = memeCid ? `user_vote_${userAddress}_meme_${memeCid}` : `user_vote_${userAddress}_${marketId}`;
    const txKey = memeCid ? `vote_tx_${userAddress}_meme_${memeCid}` : `vote_tx_${userAddress}_${marketId}`;
    
    localStorage.setItem(voteKey, voteYes ? 'funny' : 'lame');
    localStorage.setItem(txKey, hash);

    return {
      success: true,
      data: {
        transactionHash: hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status,
        vote: voteYes ? 'funny' : 'lame'
      },
    };
  } catch (error) {
    console.error("Error voting:", error);
    
    // Enhanced error handling (existing code)
    if (error instanceof Error) {
      if (error.message.includes('User rejected') || 
          error.message.includes('rejected') ||
          error.message.includes('denied')) {
        return {
          success: false,
          error: "Payment cancelled by user",
        };
      }
      
      if (error.message.includes('insufficient funds') ||
          error.message.includes('insufficient balance')) {
        return {
          success: false,
          error: "Insufficient balance to complete transaction",
        };
      }
      
      if (error.message.includes('execution reverted') ||
          error.message.includes('already voted')) {
        return {
          success: false,
          error: "Transaction failed: You have already voted on this market.",
        };
      }
      
      if (error.message.includes('Internal JSON-RPC error')) {
        return {
          success: false,
          error: "Transaction failed: You may have already voted on this market, or there may be a network issue. Please try again.",
        };
      }
      
      if (error.message.includes('Market does not exist')) {
        return {
          success: false,
          error: "This market does not exist.",
        };
      }
      
      if (error.message.includes('Market is not active')) {
        return {
          success: false,
          error: "This market is no longer active.",
        };
      }
      
      if (error.message.includes('Voting period ended')) {
        return {
          success: false,
          error: "The voting period for this market has ended.",
        };
      }
      
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: false,
      error: "Voting failed due to unknown error",
    };
  }
};

// **NEW: Function to get user's voting history**
export const getUserVotingHistory = async (userAddress: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_ROUTE}/api/user-votes/${userAddress}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch voting history');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error fetching voting history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// **NEW: Function to get user's settlement history**
export const getUserSettlements = async (userAddress: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_ROUTE}/api/user-settlements/${userAddress}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch settlement history');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error fetching settlement history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// **NEW: Function to get settlement status for a market**
export const getSettlementStatus = async (marketId: number): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_ROUTE}/api/settlement-status/${marketId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch settlement status');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error fetching settlement status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// **NEW: Function to manually trigger settlement (admin)**
export const manualSettle = async (marketId: number): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_ROUTE}/api/manual-settle/${marketId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to trigger settlement');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error triggering settlement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const giveGas = async (address: string) => {
  try {
    const response = await fetch(`${API_ROUTE}/api/faucet/${address}`);
    const res = await response.json();
    
    if (!response.ok) {
      console.warn(`Faucet request failed: ${res.message}`);
      // Don't throw error, just log warning since this is optional
      return { success: false, message: res.message };
    }
    
    console.log("Faucet response:", res);
    return { success: true, data: res };
  } catch (error) {
    console.warn("Faucet request failed:", error);
    // Don't throw error, just log warning
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Type definitions
type MimeType = string;
type Base64String = string;
type FileName = string;

interface FileReaderProgressEvent extends ProgressEvent {
  readonly target: (FileReader & EventTarget) | null;
}

// Convert base64 to Blob
const base64ToBlob = (
  base64String: Base64String, 
  mimeType: MimeType = 'application/octet-stream'
): Blob => {
  // Remove data URL prefix if present
  const base64WithoutPrefix = base64String.replace(/^data:.*,/, '');
  
  // Convert base64 to byte array
  const byteCharacters = atob(base64WithoutPrefix);
  const byteArrays: Uint8Array[] = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: mimeType });
};

// Convert base64 to File
const base64ToFile = (
  base64String: Base64String, 
  fileName: FileName, 
  mimeType: MimeType = 'application/octet-stream'
): File => {
  const blob = base64ToBlob(base64String, mimeType);
  return new File([blob], fileName, { type: mimeType });
};

// Download base64 as file
const downloadBase64File = (
  base64String: Base64String, 
  fileName: FileName, 
  mimeType: MimeType = 'application/octet-stream'
): void => {
  const blob = base64ToBlob(base64String, mimeType);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  window.URL.revokeObjectURL(url);
};

// Error handling with types
interface Base64Error extends Error {
  code: string;
  details?: unknown;
}

// Helper function to create typed errors
const createBase64Error = (
  message: string, 
  code: string, 
  details?: unknown
): Base64Error => {
  const error: Base64Error = new Error(message) as Base64Error;
  error.code = code;
  if (details) error.details = details;
  return error;
};

// Safe base64 conversion with error handling
export const safeBase64ToFile = (
  base64String: Base64String, 
  fileName: FileName, 
  mimeType: MimeType = 'application/octet-stream'
): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      if (!base64String) {
        throw createBase64Error(
          'Base64 string is required', 
          'INVALID_INPUT'
        );
      }
      
      const file = base64ToFile(base64String, fileName, mimeType);
      resolve(file);
    } catch (error) {
      reject(createBase64Error(
        'Failed to convert base64 to file',
        'CONVERSION_ERROR',
        error
      ));
    }
  });
};

// BONUS: Helper function to check if user has sufficient balance
export const checkUserBalance = async (
  userAddress: string,
  requiredAmount: string = "0.0001"
): Promise<{ hasEnough: boolean; balance: string; required: string }> => {
  try {
    // You can implement balance checking logic here
    // This is a placeholder that you can enhance based on your needs
    return {
      hasEnough: true, // Placeholder
      balance: "0", // Placeholder
      required: requiredAmount
    };
  } catch (error) {
    console.error("Error checking balance:", error);
    return {
      hasEnough: false,
      balance: "0",
      required: requiredAmount
    };
  }
};

// BONUS: Helper to format transaction errors for user display
export const formatTransactionError = (error: string): string => {
  const errorMap: Record<string, string> = {
    'User rejected': 'You cancelled the transaction',
    'insufficient funds': 'Not enough ETH in your wallet',
    'execution reverted': 'Transaction failed - you may have already voted',
    'network': 'Network connection problem',
    'nonce': 'Please refresh the page and try again'
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }

  return 'Transaction failed. Please try again.';
};