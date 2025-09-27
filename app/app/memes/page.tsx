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
import { ImagePlus } from "lucide-react";
import { useReadContract, useReadContracts } from 'wagmi';
import { Address, Abi } from 'viem';
import { CONTRACT_ABI, DEPLOYED_CONTRACT } from "@/lib/ethers";
import type { Meme } from "@/types/contract";

interface MemeWithImage extends Meme {
  image?: string;
}

const MemeGallery = () => {
  const [memes, setMemes] = useState<MemeWithImage[]>([]);
  const router = useRouter();

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
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="max-w-7xl mx-auto px-2 py-4">
        {memes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-gray-400">
            <p className="text-xl font-medium">No memes found</p>
            <p className="mt-2">Be the first to create a meme template!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 sm:gap-2">
            {memes.map((meme, index) => (
              <motion.div
                key={`${meme.memeTemplate}-${index}`}
                layoutId={`meme-${meme.memeTemplate}-${index}`}
                onClick={() => handleMemeClick(meme)}
                className="relative group cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  <Image
                    src={meme.image || ""}
                    alt={`Meme ${index}`}
                    className="w-full h-full object-contain rounded-xl"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Link
        href="/app/memes/create"
        className="fixed bottom-6 right-6 p-4 bg-blue-500 rounded-full shadow-lg hover:bg-blue-600 transition-colors md:hidden"
      >
        <ImagePlus className="w-6 h-6" />
      </Link>
    </div>
  );
};

export default MemeGallery;