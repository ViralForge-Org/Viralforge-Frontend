// "use client";

// import React, { useEffect, useState } from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { useRouter } from "next/navigation";
// import { ImagePlus, Loader2 } from "lucide-react";
// import { useReadContract, useReadContracts } from 'wagmi'; // Assuming you're using wagmi
// import { Address, Abi } from 'viem';
// import { CONTRACT_ABI, DEPLOYED_CONTRACT } from "@/lib/ethers";

// interface Meme {
//   creator: string;
//   cid: string;
//   memeTemplate: number;
//   image?: string;
// }

// const MemeGallery = () => {
//   const [memes, setMemes] = useState<Meme[]>([]);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   // Get market count
//   const { data: marketCount } = useReadContract({
//     address: DEPLOYED_CONTRACT,
//     abi: CONTRACT_ABI,
//     functionName: "marketCount",
//     args: [],
//   });

//   // Create contracts array for fetching all markets
//   const marketContracts = new Array(Number(marketCount) || 0).fill(0).map(
//     (_, index) => ({
//       address: DEPLOYED_CONTRACT as Address,
//       abi: CONTRACT_ABI as Abi,
//       functionName: "getMarketMemes",
//       args: [BigInt(index)],
//     } as const)
//   );

//   // Fetch all market memes
//   const { data: allMarketMemes } = useReadContracts({
//     contracts: marketContracts as readonly unknown[],
//   });

//   useEffect(() => {
//     const populateMemes = async () => {
//       setLoading(true);
//       try {
//         if (!allMarketMemes) return;

//         // Flatten all memes from all markets into a single array
//         const allMemes = allMarketMemes.flatMap(market => 
//           market.result as Meme[]
//         ).filter(Boolean);

//         // Fetch images for all memes
//         const memesWithImages = await Promise.all(
//           allMemes.map(async (meme) => {
//             try {
//               const data = await fetch(
//                 `https://gateway.lighthouse.storage/ipfs/${meme.cid}`
//               );
//               const img = await data.text();
//               return {
//                 ...meme,
//                 image: `data:image/png;base64,${img}`
//               };
//             } catch (error) {
//               console.error(`Error fetching meme ${meme.cid}:`, error);
//               return meme;
//             }
//           })
//         );

//         setMemes(memesWithImages);
//       } catch (error) {
//         console.error("Error loading memes:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     populateMemes();
//   }, [allMarketMemes]);

//   const handleMemeClick = (meme: Meme) => {
//     router.push(`/app/memes/templates/${meme.memeTemplate}`);
//   };

//   // Rest of your component remains the same, just update the mapping:
//   return (
//     <div className="min-h-screen bg-gray-900 text-white">
//       <main className="max-w-7xl mx-auto px-2 py-4">
//         {memes.length === 0 ? (
//           <div className="flex flex-col items-center justify-center h-96 text-gray-400">
//             <p className="text-xl font-medium">No memes found</p>
//             <p className="mt-2">Be the first to create a meme template!</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 sm:gap-2">
//             {memes.map((meme, index) => (
//               <motion.div
//                 key={`${meme.memeTemplate}-${index}`}
//                 layoutId={`meme-${meme.memeTemplate}-${index}`}
//                 onClick={() => handleMemeClick(meme)}
//                 className="relative group cursor-pointer"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 whileHover={{ scale: 0.98 }}
//                 transition={{ duration: 0.2 }}
//               >
//                 <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
//                   <img
//                     src={meme.image}
//                     alt={`Meme ${index}`}
//                     className="w-full h-full object-contain rounded-xl"
//                   />
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         )}
//       </main>
//       <Link
//         href="/app/memes/create"
//         className="fixed bottom-6 right-6 p-4 bg-blue-500 rounded-full shadow-lg hover:bg-blue-600 transition-colors md:hidden"
//       >
//         <ImagePlus className="w-6 h-6" />
//       </Link>
//     </div>
//   );
// };

// export default MemeGallery;


// client/app/app/memes/page.tsx - Fix similar typing issues
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ImagePlus, Sparkles, TrendingUp } from "lucide-react";
import { useReadContract, useReadContracts } from 'wagmi';
import { Address, Abi } from 'viem';
import { CONTRACT_ABI, DEPLOYED_CONTRACT } from "@/lib/ethers";
import type { Meme } from "@/types/contract";

interface MemeWithImage extends Meme {
  image?: string;
}

const MemeGallery = () => {
  const [memes, setMemes] = useState<MemeWithImage[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get market count with proper typing
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
      functionName: "getMarketMemes",
      args: [BigInt(index)],
    } as const)
  );

  // Fetch all market memes with proper typing
  const { data: allMarketMemes } = useReadContracts({
    contracts: marketContracts as readonly unknown[],
  }) as { data: Array<{ result: Meme[] }> | undefined };

  useEffect(() => {
    const populateMemes = async () => {
      try {
        if (!allMarketMemes) return;

        // Flatten all memes from all markets into a single array
        const allMemes = allMarketMemes.flatMap(market => 
          (market.result as Meme[]) || []
        ).filter(Boolean);

        // Fetch images for all memes
        const memesWithImages = await Promise.all(
          allMemes.map(async (meme) => {
            try {
              const data = await fetch(
                `https://gateway.lighthouse.storage/ipfs/${meme.cid}`
              );
              const img = await data.text();
              return {
                ...meme,
                image: `data:image/png;base64,${img}`
              } as MemeWithImage;
            } catch (error) {
              console.error(`Error fetching meme ${meme.cid}:`, error);
              return meme as MemeWithImage;
            }
          })
        );

        setMemes(memesWithImages);
      } catch (error) {
        console.error("Error loading memes:", error);
      }
    };

    populateMemes();
  }, [allMarketMemes]);

  const handleMemeClick = (meme: MemeWithImage) => {
    router.push(`/app/memes/templates/${meme.memeTemplate}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-red-100 text-gray-900 relative overflow-hidden">
      {/* Comic Dot Pattern Background */}
      <div className="absolute inset-0 opacity-30"
           style={{
             backgroundImage: `radial-gradient(circle, #ff6b6b 1px, transparent 1px)`,
             backgroundSize: '20px 20px'
           }} />

      {/* Comic Style Floating Elements */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl font-bold text-red-400 opacity-20"
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
                duration: Math.random() * 30 + 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {['POW!', 'BAM!', 'ZAP!', 'BOOM!', '★'][Math.floor(Math.random() * 5)]}
            </motion.div>
          ))}
        </div>
      )}

      {/* Navigation */}

      {/* Header Section */}
      <div className="relative pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-6xl font-black text-red-600 mb-4 transform -rotate-2 drop-shadow-lg"
                style={{
                  textShadow: '4px 4px 0px #ffeb3b, -2px -2px 0px #ff5722',
                  fontFamily: 'Comic Sans MS, cursive'
                }}>
              MEME CENTRAL!
            </h1>
            <p className="text-gray-700 text-lg md:text-xl max-w-2xl mx-auto font-bold">
              🎨 Create amazing memes and vote for the funniest ones! 🚀
            </p>
          </motion.div>

          {/* Comic Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
            <motion.div
              className="bg-yellow-300 border-4 border-black rounded-lg p-4 transform rotate-1 shadow-lg"
              whileHover={{ scale: 1.1, rotate: 3 }}
            >
              <Sparkles className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-black text-black">{memes.length}</div>
              <div className="text-xs text-gray-800 font-bold uppercase">TOTAL MEMES</div>
            </motion.div>
            <motion.div
              className="bg-blue-300 border-4 border-black rounded-lg p-4 transform -rotate-1 shadow-lg"
              whileHover={{ scale: 1.1, rotate: -3 }}
            >
              <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-black text-black">∞</div>
              <div className="text-xs text-gray-800 font-bold uppercase">VIRAL POWER</div>
            </motion.div>
            <motion.div
              className="bg-pink-300 border-4 border-black rounded-lg p-4 transform rotate-2 shadow-lg"
              whileHover={{ scale: 1.1, rotate: 4 }}
            >
              <ImagePlus className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-black text-black">24/7</div>
              <div className="text-xs text-gray-800 font-bold uppercase">CREATION</div>
            </motion.div>
            <motion.div
              className="bg-green-300 border-4 border-black rounded-lg p-4 transform -rotate-2 shadow-lg"
              whileHover={{ scale: 1.1, rotate: -4 }}
            >
              <Sparkles className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-black text-black">🚀</div>
              <div className="text-xs text-gray-800 font-bold uppercase">LAUNCH</div>
            </motion.div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-20">
        {memes.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center h-96 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-yellow-300 border-4 border-black rounded-2xl p-12 max-w-md transform -rotate-2 shadow-xl">
              <Sparkles className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-black mb-2 transform rotate-1">NO MEMES YET!</h3>
              <p className="text-gray-800 mb-6 font-bold">🦸‍♂️ Be the FIRST superhero to create an epic meme! 💥</p>
              <Link
                href="/app/memes/create"
                className="inline-flex items-center px-6 py-3 bg-red-500 hover:bg-red-600 border-4 border-black text-white rounded-xl font-black transition-all duration-300 transform hover:scale-110 shadow-lg uppercase"
              >
                <ImagePlus className="w-5 h-5 mr-2" />
                CREATE NOW!
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {memes.map((meme, index) => (
              <motion.div
                key={`${meme.memeTemplate}-${index}`}
                layoutId={`meme-${meme.memeTemplate}-${index}`}
                onClick={() => handleMemeClick(meme)}
                className="relative group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -8, rotate: Math.random() * 6 - 3 }}
              >
                <div className="relative bg-white border-4 border-black rounded-2xl overflow-hidden shadow-xl transform transition-all duration-300 group-hover:shadow-2xl">
                  {/* Comic burst effect on hover */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 border-2 border-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-xs font-black">
                    💥
                  </div>

                  <div className="aspect-square relative overflow-hidden">
                    <Image
                      src={meme.image || ""}
                      alt={`Meme ${index}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />

                    {/* Comic book halftone overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 via-transparent to-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                         style={{
                           backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.3) 1px, transparent 1px)`,
                           backgroundSize: '10px 10px'
                         }} />

                    {/* Template ID Badge - Comic Style */}
                    <div className="absolute top-3 right-3 bg-red-500 border-2 border-black text-white text-xs px-2 py-1 rounded-lg font-black transform rotate-12">
                      #{meme.memeTemplate}
                    </div>
                  </div>

                  {/* Comic Info Bar */}
                  <div className="p-4 bg-gradient-to-r from-blue-200 to-purple-200 border-t-4 border-black">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-black font-black uppercase">Template {meme.memeTemplate}</span>
                      <div className="flex items-center space-x-1">
                        <Sparkles className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs text-black font-bold uppercase">VIRAL!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Comic Floating Action Button - Mobile Only */}
      <Link
        href="/app/memes/create"
        className="fixed bottom-20 right-6 p-4 bg-red-500 border-4 border-black rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 md:hidden z-40"
      >
        <ImagePlus className="w-6 h-6 text-white" />
      </Link>
    </div>
  );
};

export default MemeGallery;