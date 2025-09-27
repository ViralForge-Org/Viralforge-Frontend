"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { CONTRACT_ABI, DEPLOYED_CONTRACT } from '@/lib/ethers';
import { Abi, Address } from 'viem';
import { Clock, TrendingUp, TrendingDown, ExternalLink, X } from 'lucide-react';

interface UserBet {
  marketId: number;
  userVote: 'funny' | 'lame';
  stakeAmount: string;
  template: {
    creator: string;
    endTime: bigint;
    yesVotes: bigint;
    noVotes: bigint;
    totalStaked: bigint;
    isActive: boolean;
    metadata: string;
    image: string;
  };
  settlement?: {
    isSettled: boolean;
    userWon: boolean;
    winnerSide: 'funny' | 'lame';
    userPayout: string;
    settlementTx: string;
    settledAt: Date;
  };
}

const UserSettlementsPage = () => {
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [selectedBet, setSelectedBet] = useState<UserBet | null>(null);
  const [loading, setLoading] = useState(true);
  const { address, isConnected } = useAccount();

  // Get market count
  const { data: marketCount } = useReadContract({
    address: DEPLOYED_CONTRACT,
    abi: CONTRACT_ABI,
    functionName: "marketCount",
    args: [],
  }) as { data: bigint | undefined };

  // Create contracts array for fetching all markets
  const marketContracts = new Array(Number(marketCount) || 0).fill(0).map(
    (_, index) => ({
      address: DEPLOYED_CONTRACT as Address,
      abi: CONTRACT_ABI as Abi,
      functionName: "getMarket",
      args: [BigInt(index)],
    } as const)
  );

  const { data: allMarkets } = useReadContracts({
    contracts: marketContracts as readonly unknown[],
  });

  useEffect(() => {
    const loadUserBets = async () => {
      if (!address || !allMarkets) return;
      
      setLoading(true);
      try {
        const userBetsData: UserBet[] = [];
        
        // First, try to get user votes from the database (most reliable)
        let userVotesFromDB: any[] = [];
        try {
          const API_ROUTE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
          const votesResponse = await fetch(`${API_ROUTE}/api/user-votes/${address}`);
          if (votesResponse.ok) {
            userVotesFromDB = await votesResponse.json();
            console.log(`📊 Found ${userVotesFromDB.length} votes in database for user ${address}`);
          }
        } catch (error) {
          console.log("Could not fetch votes from database, falling back to localStorage:", error);
        }
        
        for (let i = 0; i < allMarkets.length; i++) {
          const market = allMarkets[i].result as any;
          if (!market) continue;
          
          // Check if user voted in this market
          let userVote = null;
          
          // First, check database
          const dbVote = userVotesFromDB.find(vote => vote.marketId === i);
          if (dbVote) {
            userVote = dbVote.vote;
            console.log(`✅ Found vote for market ${i} from database: ${userVote}`);
          }
          
          // If not in database, check localStorage patterns
          if (!userVote) {
            // Check old pattern
            userVote = localStorage.getItem(`user_vote_${address}_${i}`);
            
            // Check new meme-specific patterns
            if (!userVote) {
              try {
                const API_ROUTE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                const memeResponse = await fetch(`${API_ROUTE}/api/memes/${i}`);
                if (memeResponse.ok) {
                  const memesData = await memeResponse.json();
                  if (memesData && memesData.length > 0) {
                    // Check if user voted on any meme in this market
                    for (const meme of memesData) {
                      const memeVote = localStorage.getItem(`user_vote_${address}_meme_${meme.cid}`);
                      const simpleMemeVote = localStorage.getItem(`voted_meme_${meme.cid}`);
                      
                      if (memeVote || simpleMemeVote) {
                        userVote = memeVote || 'funny'; // Default to funny if simple vote found
                        console.log(`✅ Found vote for market ${i} from localStorage: ${userVote}`);
                        break;
                      }
                    }
                  }
                }
              } catch (error) {
                console.log(`Could not fetch memes for market ${i}:`, error);
              }
            }
            
            // Still no vote found? Check for any keys related to this user and market
            if (!userVote) {
              const allKeys = Object.keys(localStorage);
              const marketVoteKey = allKeys.find(key => 
                key.includes(`user_vote_${address}`) && 
                (key.includes(`_${i}`) || key.includes(`_meme_`))
              );
              if (marketVoteKey) {
                userVote = localStorage.getItem(marketVoteKey);
                console.log(`✅ Found vote for market ${i} from localStorage fallback: ${userVote}`);
              }
            }
          }
          
          if (!userVote) continue;

          // Fetch template image
          const [creator, endTime, yesVotes, noVotes, totalStaked, isActive, metadata] = market;
          let image = '';
          try {
            const data = await fetch(`https://gateway.lighthouse.storage/ipfs/${metadata}`);
            const img = await data.text();
            image = `data:image/png;base64,${img}`;
          } catch (error) {
            console.error(`Error fetching image for market ${i}:`, error);
          }

          // Check settlement status - try to get real settlement data from database
          const now = Math.floor(Date.now() / 1000);
          const isSettled = !isActive;
          const shouldBeSettled = now > Number(endTime);
          
          let settlement = undefined;
          if (isSettled || shouldBeSettled) {
            // Try to fetch real settlement data from database
            let realSettlement = null;
            try {
              const API_ROUTE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
              const settlementResponse = await fetch(`${API_ROUTE}/api/settlement/${i}`);
              if (settlementResponse.ok) {
                realSettlement = await settlementResponse.json();
                console.log(`💾 Found real settlement data for market ${i}:`, realSettlement);
              }
            } catch (error) {
              console.log(`Could not fetch settlement data for market ${i}:`, error);
            }
            
            const winnerSide: 'funny' | 'lame' = Number(yesVotes) > Number(noVotes) ? 'funny' : 'lame';
            const userWon = userVote === winnerSide;
            
            let userPayout = '0';
            let settlementTx = '';
            let settledAt = new Date(Number(endTime) * 1000);
            
            if (realSettlement) {
              // Use real settlement data
              const userParticipation = realSettlement.participants?.find((p: any) => p.address.toLowerCase() === address.toLowerCase());
              if (userParticipation) {
                userPayout = userParticipation.won ? (Number(userParticipation.payout) / 1e18).toFixed(6) : '0';
              } else {
                // Calculate estimated payout if user not in participants yet
                const winningVotes = winnerSide === 'funny' ? Number(yesVotes) : Number(noVotes);
                const totalPool = Number(totalStaked) / 1e18;
                const voterPool = totalPool * 0.95;
                userPayout = userWon && winningVotes > 0 ? (voterPool / winningVotes).toFixed(6) : '0';
              }
              
              settlementTx = realSettlement.settlementTx;
              settledAt = new Date(realSettlement.settledAt);
            } else {
              // Fallback to calculated payout
              const winningVotes = winnerSide === 'funny' ? Number(yesVotes) : Number(noVotes);
              const totalPool = Number(totalStaked) / 1e18;
              const voterPool = totalPool * 0.95;
              userPayout = userWon && winningVotes > 0 ? (voterPool / winningVotes).toFixed(6) : '0';
              settlementTx = isSettled ? 'Pending transaction data...' : '';
            }
            
            settlement = {
              isSettled,
              userWon,
              winnerSide,
              userPayout,
              settlementTx,
              settledAt
            };
          }

          userBetsData.push({
            marketId: i,
            userVote: userVote as 'funny' | 'lame',
            stakeAmount: '0.0001',
            template: {
              creator,
              endTime,
              yesVotes,
              noVotes,
              totalStaked,
              isActive,
              metadata,
              image
            },
            settlement
          });
        }
        
        // Add mock demo card only for specific wallet (demo purposes)
        if (address?.toLowerCase() === '0xebc99e8a6fad706af50b68463acf9bf550a54ab7') {
          const mockBet: UserBet = {
            marketId: 999, // Use high number to avoid conflicts
            userVote: 'funny',
            stakeAmount: '0.0001',
            template: {
              creator: '0xDemo123...',
              endTime: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
              yesVotes: BigInt(15),
              noVotes: BigInt(8),
              totalStaked: BigInt('2300000000000000'), // 0.0023 ETH in wei
              isActive: false,
              metadata: 'Demo Template',
              image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5'
            },
            settlement: {
              isSettled: true,
              userWon: true,
              winnerSide: 'funny',
              userPayout: '0.001457',
              settlementTx: '0x543862bb4e6b8e0403fbf665f70bce6f4f73adf504581dc078f76efef1dd5a48',
              settledAt: new Date(Date.now() - 1800000) // 30 minutes ago
            }
          };
          
          // Add mock bet at the beginning for demo visibility
          userBetsData.unshift(mockBet);
        }
        
        setUserBets(userBetsData);
      } catch (error) {
        console.error('Error loading user bets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserBets();
  }, [address, allMarkets]);

  const formatTimeLeft = (endTime: bigint): string => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(endTime) - now;
    
    if (timeLeft <= 0) return "Ended";
    
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    return `${hours}h ${minutes}m left`;
  };

  const getCardStatus = (bet: UserBet) => {
    if (!bet.settlement) {
      return {
        status: 'active',
        color: 'bg-blue-500/20 border-blue-500/50',
        text: formatTimeLeft(bet.template.endTime)
      };
    }
    
    if (!bet.settlement.isSettled) {
      return {
        status: 'pending',
        color: 'bg-yellow-500/20 border-yellow-500/50',
        text: 'Pending Settlement'
      };
    }
    
    return {
      status: bet.settlement.userWon ? 'won' : 'lost',
      color: bet.settlement.userWon ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50',
      text: bet.settlement.userWon ? `Won ${bet.settlement.userPayout} ETH` : 'Lost'
    };
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-red-100 text-gray-900 relative overflow-hidden">
        {/* Comic Dot Pattern Background */}
        <div className="absolute inset-0 opacity-30"
             style={{
               backgroundImage: `radial-gradient(circle, #ff6b6b 1px, transparent 1px)`,
               backgroundSize: '20px 20px'
             }} />


        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center bg-yellow-300 border-4 border-black rounded-2xl p-12 max-w-md transform -rotate-2 shadow-xl">
            <h2 className="text-2xl font-black mb-4 transform rotate-1"
                style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              CONNECT WALLET! 🔗
            </h2>
            <p className="text-gray-800 font-bold">Connect your wallet to view your epic betting history! 💰</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-red-100 text-gray-900 relative overflow-hidden">
        {/* Comic Dot Pattern Background */}
        <div className="absolute inset-0 opacity-30"
             style={{
               backgroundImage: `radial-gradient(circle, #ff6b6b 1px, transparent 1px)`,
               backgroundSize: '20px 20px'
             }} />


        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center bg-blue-300 border-4 border-black rounded-2xl p-12 max-w-md transform rotate-2 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-black mx-auto mb-4"
                 style={{ borderTopColor: 'transparent' }}></div>
            <p className="font-black text-gray-900"
               style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              LOADING YOUR BETS... 🎲
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-red-100 text-gray-900 relative overflow-hidden">
      {/* Comic Dot Pattern Background */}
      <div className="absolute inset-0 opacity-30"
           style={{
             backgroundImage: `radial-gradient(circle, #ff6b6b 1px, transparent 1px)`,
             backgroundSize: '20px 20px'
           }} />

      {/* Comic Style Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['WIN!', 'LOSE!', 'MONEY!', '💰', '🏆', '📊'].map((text, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl font-bold text-green-500 opacity-20"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              rotate: Math.random() * 360
            }}
            animate={{
              y: [null, -50],
              rotate: [null, 360],
              opacity: [0.2, 0, 0.2]
            }}
            transition={{
              duration: Math.random() * 35 + 25,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {text}
          </motion.div>
        ))}
      </div>


      <div className="relative max-w-7xl mx-auto px-4 py-20">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-red-600 mb-4 transform -rotate-2"
              style={{
                textShadow: '4px 4px 0px #ffeb3b, -2px -2px 0px #ff5722',
                fontFamily: 'Comic Sans MS, cursive'
              }}>
            YOUR SETTLEMENTS! 💰
          </h1>
          <p className="text-gray-700 text-lg font-bold">Track your meme bets and epic winnings! 🏆</p>
        </div>

        {userBets.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-pink-300 border-4 border-black rounded-2xl p-12 max-w-md mx-auto transform rotate-1 shadow-xl">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-2xl font-black mb-2 transform -rotate-1"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                NO BETS YET!
              </h3>
              <p className="text-gray-800 font-bold">🎲 Start voting on meme templates to see your epic settlements here! 💸</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userBets.map((bet) => {
              const cardStatus = getCardStatus(bet);
              
              return (
                <motion.div
                  key={bet.marketId}
                  whileHover={{ scale: 1.05, rotate: Math.random() * 4 - 2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedBet(bet)}
                  className="cursor-pointer bg-white border-4 border-black rounded-2xl overflow-hidden shadow-xl transition-all duration-300 transform hover:shadow-2xl"
                >
                  {/* Template Image */}
                  <div className="aspect-square relative">
                    <Image
                      src={bet.template.image}
                      alt={`Template ${bet.marketId}`}
                      className="w-full h-full object-cover"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    
                    {/* Comic Status Badge */}
                    <div className="absolute top-3 right-3">
                      <div className={`px-3 py-1 border-2 border-black rounded-lg text-xs font-black transform rotate-12 ${
                        cardStatus.status === 'won' ? 'bg-green-400 text-black' :
                        cardStatus.status === 'lost' ? 'bg-red-400 text-white' :
                        cardStatus.status === 'pending' ? 'bg-yellow-400 text-black' :
                        'bg-blue-400 text-white'
                      }`}>
                        {cardStatus.status === 'won' ? '🎉 WON!' :
                         cardStatus.status === 'lost' ? '😞 LOST!' :
                         cardStatus.status === 'pending' ? '⏳ PENDING!' :
                         '🔴 LIVE!'}
                      </div>
                    </div>

                    {/* Comic Vote Badge */}
                    <div className="absolute top-3 left-3">
                      <div className={`px-3 py-1 border-2 border-black rounded-lg text-xs font-black transform -rotate-12 ${
                        bet.userVote === 'funny' ? 'bg-green-400 text-black' : 'bg-red-400 text-white'
                      }`}>
                        YOU: {bet.userVote === 'funny' ? '👍 FUNNY!' : '👎 LAME!'}
                      </div>
                    </div>
                  </div>

                  {/* Comic Card Details */}
                  <div className="p-4 bg-gradient-to-r from-blue-200 to-purple-200 border-t-4 border-black">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-black font-black uppercase">Template #{bet.marketId}</span>
                      <span className="text-sm font-black text-black transform rotate-1">{cardStatus.text}</span>
                    </div>

                    {/* Comic Vote Statistics */}
                    <div className="flex justify-between mb-3">
                      <div className="flex items-center gap-2 bg-green-300 border-2 border-black rounded-lg px-2 py-1 transform -rotate-1">
                        <TrendingUp className="w-4 h-4 text-green-700" />
                        <span className="text-green-700 text-sm font-black">{Number(bet.template.yesVotes)} FUNNY</span>
                      </div>
                      <div className="flex items-center gap-2 bg-red-300 border-2 border-black rounded-lg px-2 py-1 transform rotate-1">
                        <TrendingDown className="w-4 h-4 text-red-700" />
                        <span className="text-red-700 text-sm font-black">{Number(bet.template.noVotes)} LAME</span>
                      </div>
                    </div>

                    {/* Comic Progress Bar */}
                    <div className="bg-black border-2 border-black h-4 rounded-full overflow-hidden mb-3 transform -rotate-1">
                      <div
                        className="bg-green-400 h-full transition-all duration-500 border-r-2 border-black"
                        style={{
                          width: `${
                            (Number(bet.template.yesVotes) /
                              (Number(bet.template.yesVotes) + Number(bet.template.noVotes))) *
                              100 || 0
                          }%`,
                        }}
                      />
                    </div>

                    {/* Comic Stake Info */}
                    <div className="text-xs text-black font-black bg-yellow-300 border-2 border-black rounded-lg px-2 py-1 transform rotate-1 text-center">
                      YOUR STAKE: {bet.stakeAmount} ETH 💰
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Detailed Settlement Modal */}
        <AnimatePresence>
          {selectedBet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedBet(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white border-4 border-black rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                {/* Comic Modal Header */}
                <div className="p-6 border-b-4 border-black bg-yellow-300">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-black transform -rotate-1"
                        style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                      SETTLEMENT DETAILS! 📊
                    </h2>
                    <button
                      onClick={() => setSelectedBet(null)}
                      className="p-2 bg-red-500 hover:bg-red-600 border-2 border-black rounded-lg transition-colors transform rotate-12"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {/* Template Image */}
                  <div className="aspect-video bg-gray-700 rounded-xl overflow-hidden mb-6">
                    <Image
                      src={selectedBet.template.image}
                      alt={`Template ${selectedBet.marketId}`}
                      className="w-full h-full object-contain"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>

                  {/* Settlement Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-700/50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-3">Your Bet</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Template ID:</span>
                          <span>#{selectedBet.marketId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Your Vote:</span>
                          <span className={selectedBet.userVote === 'funny' ? 'text-green-400' : 'text-red-400'}>
                            {selectedBet.userVote === 'funny' ? '👍 Funny' : '👎 Lame'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Stake Amount:</span>
                          <span>{selectedBet.stakeAmount} ETH</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700/50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-3">Results</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Votes:</span>
                          <span>{Number(selectedBet.template.yesVotes) + Number(selectedBet.template.noVotes)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-400">Funny Votes:</span>
                          <span>{Number(selectedBet.template.yesVotes)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-400">Lame Votes:</span>
                          <span>{Number(selectedBet.template.noVotes)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Pool:</span>
                          <span>{(Number(selectedBet.template.totalStaked) / 1e18).toFixed(4)} ETH</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settlement Results */}
                  {selectedBet.settlement && (
                    <div className={`rounded-xl p-6 ${
                      selectedBet.settlement.userWon ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
                    }`}>
                      <div className="text-center mb-4">
                        <div className="text-4xl mb-2">
                          {selectedBet.settlement.userWon ? '🎉' : '😞'}
                        </div>
                        <h3 className={`text-2xl font-bold ${
                          selectedBet.settlement.userWon ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {selectedBet.settlement.userWon ? 'You Won!' : 'You Lost'}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-gray-400 text-sm">Winning Side</p>
                          <p className={`font-bold ${
                            selectedBet.settlement.winnerSide === 'funny' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {selectedBet.settlement.winnerSide === 'funny' ? '👍 Funny' : '👎 Lame'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Your Payout</p>
                          <p className="font-bold text-white">
                            {selectedBet.settlement.userPayout} ETH
                          </p>
                        </div>
                      </div>

                      {selectedBet.settlement?.isSettled && selectedBet.settlement?.settlementTx && (
                        <div className="mt-4 pt-4 border-t border-gray-600">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Settlement Transaction:</span>
                            {selectedBet.settlement?.settlementTx?.startsWith('0x') && selectedBet.settlement.settlementTx.length > 20 ? (
                              <a
                                href={`https://worldchain-sepolia.blockscout.com/tx/${selectedBet.settlement.settlementTx}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                              >
                                View on Explorer
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="text-yellow-400 text-sm">
                                {selectedBet.settlement?.settlementTx}
                              </span>
                            )}
                          </div>
                          {selectedBet.settlement?.settlementTx?.startsWith('0x') && selectedBet.settlement.settlementTx.length > 20 ? (
                            <div className="bg-gray-700/50 rounded-lg p-3">
                              <p className="text-xs text-gray-300 font-mono break-all">
                                {selectedBet.settlement.settlementTx}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => navigator.clipboard.writeText(selectedBet.settlement?.settlementTx || '')}
                                  className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                  📋 Copy Transaction ID
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic">
                              Transaction data will be available once settlement is processed
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Market Info */}
                  {!selectedBet.settlement && (
                    <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-6 text-center">
                      <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <h3 className="text-lg font-semibold mb-2">Market Active</h3>
                      <p className="text-gray-400 mb-2">
                        Time remaining: {formatTimeLeft(selectedBet.template.endTime)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Settlement will happen automatically after the voting period ends
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserSettlementsPage;