/* eslint-disable */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import {
  useReadContract,
  useReadContracts,
} from "wagmi";
import { useTransactions } from "@/hooks/useTransactions";
import { CONTRACT_ABI, DEPLOYED_CONTRACT } from "@/lib/ethers";
import { TrueApi } from "@truenetworkio/sdk";
import { uploadImage } from "@/lib/utils";
import { Abi, Address } from "viem";

interface Stage1Props {
  setCapturedImage: (image: string | null) => void;
  capturedImage: string | null;
  setStage: (stage: number) => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  trueApi?: TrueApi;
  setmemeTemplate: (state: number) => void;
}

const Stage1: React.FC<Stage1Props> = ({
  setCapturedImage,
  capturedImage,
  setStage,
  setIsLoading,
  setLoadingMessage,
  trueApi,
  setmemeTemplate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [ipfsCid, setIpfsCid] = useState<string | null>(null);
  const [isUploadingToIpfs, setIsUploadingToIpfs] = useState(false);
  const [templates, setTemplates] = useState<
    [string, bigint, bigint, bigint, bigint, boolean, string, string][]
  >([]);

  const { createMarket } = useTransactions();
  const [isCreatingMarket, setIsCreatingMarket] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { data: marketCount } = useReadContract({
    address: DEPLOYED_CONTRACT,
    abi: CONTRACT_ABI,
    functionName: "marketCount",
    args: [],
  });

  const contracts = new Array(Number(marketCount) || 0).fill(0).map(
    (_, index) =>
      ({
        address: DEPLOYED_CONTRACT as Address,
        abi: CONTRACT_ABI as Abi,
        functionName: "getMarket",
        args: [BigInt(index)],
      } as const)
  );

  const { data: MemeTemplates } = useReadContracts({
    contracts: contracts as readonly unknown[],
  });

  useEffect(() => {
    const populateTemplates = async () => {
      const temps = [];
      if (!MemeTemplates) return;

      for (const temp of MemeTemplates) {
        // Type assertion for the result
        const result = temp.result as [
          string,
          bigint,
          bigint,
          bigint,
          bigint,
          boolean,
          string,
          string
        ];
        const data = await fetch(
          `https://gateway.lighthouse.storage/ipfs/${result[6]}`
        );
        const img = await data.text();

        result[7] = `data:image/png;base64,${img}`;

        temps.push(result);
      }

      setTemplates(temps);
    };

    populateTemplates();
  }, [MemeTemplates]);

  // Monitor transaction hash
  useEffect(() => {
    if (txHash) {
      console.log("Transaction hash received:", txHash);
      setLoadingMessage("Transaction submitted, waiting for confirmation...");

      // Auto-proceed to next stage after creating market
      setTimeout(() => {
        setStage(2);
        setIsLoading(false);
        setLoadingMessage("");
        setSelectedImage(null);
        // Pass both base64 and IPFS URL to the next stage
        setCapturedImage(
          base64Image || (ipfsCid ? `https://ipfs.io/ipfs/${ipfsCid}` : null)
        );
        setmemeTemplate(Number(marketCount));
      }, 3000); // Give some time for transaction to be processed
    }
  }, [txHash, setStage, setIsLoading, setLoadingMessage, setCapturedImage, ipfsCid, base64Image, marketCount, setmemeTemplate]);

  const generateTemplate = async () => {
    console.log("Generate template started");
    setIsLoading(true);
    setLoadingMessage("Preparing transaction...");

    // Wait for IPFS upload if it's still in progress
    if (isUploadingToIpfs) {
      setLoadingMessage("Waiting for IPFS upload to complete...");
      return;
    }

    if (!ipfsCid) {
      console.log("No IPFS CID found");
      setIsLoading(false);
      setLoadingMessage("");
      return;
    }

    try {
      setIsCreatingMarket(true);
      const hash = await createMarket(ipfsCid);

      if (hash) {
        console.log("Market creation transaction sent:", hash);
        setTxHash(hash);
      } else {
        throw new Error("Failed to create market transaction");
      }
    } catch (error) {
      console.error("Error creating market:", error);
      setIsLoading(false);
      setLoadingMessage("Transaction failed. Please try again.");
    } finally {
      setIsCreatingMarket(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingMessage("Processing your photo...");

    try {
      // Convert the file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setBase64Image(base64String);
        setSelectedImage(base64String);
        setLoadingMessage("Uploading to IPFS...");
        setIsUploadingToIpfs(true);

        try {
          const res = await uploadImage(
            base64String.replace(/^data:image\/\w+;base64,/, "")
          );

          // Store the CID
          setIpfsCid(res);
          setIsUploadingToIpfs(false);
        } catch (error) {
          console.error("Error uploading to IPFS:", error);
          setIsUploadingToIpfs(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing file:", error);
      setIsUploadingToIpfs(false);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleTemplateSelection = (
    template: [string, bigint, bigint, bigint, bigint, boolean, string, string],
    index: number
  ) => {
    // For templates, we'll use the template URL directly
    setSelectedImage(null);
    setBase64Image(null);

    setIpfsCid(template[6]);

    setStage(2);
    setIsLoading(false);
    setLoadingMessage("");
    setSelectedImage(null);
    // Pass both base64 and IPFS URL to the next stage
    setCapturedImage(template[7]);

    setLoadingMessage("Template is being selected...");

    setmemeTemplate(index);
  };

  // Disable template selection during IPFS upload or market creation
  const isDisabled = isCreatingMarket || isUploadingToIpfs;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full">
        <h2 className="text-2xl font-bold mb-6">Choose a Template</h2>

        {/* Grid Container */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Upload Photo Tile */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => !isDisabled && fileInputRef.current?.click()}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Camera className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Upload Photo</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isDisabled}
            />
          </motion.div>

          {/* Existing Templates */}
          {templates &&
            templates.map((template, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer group"
                onClick={() =>
                  !isDisabled && handleTemplateSelection(template, index)
                }
              >
                <img
                  src={template[7]}
                  alt={"Meme template"}
                  className="w-full h-full object-cover"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-primary/90 px-4 py-2 rounded-full text-sm font-medium text-black">
                    Use Template
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-4">
            <div className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden mb-4">
              <img
                src={selectedImage}
                alt="Selected Template"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex gap-4 justify-end">
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setBase64Image(null);
                  setIpfsCid(null);
                }}
                className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 
                           transition-colors flex items-center gap-2"
                disabled={isDisabled}
              >
                Cancel
              </button>
              <button
                onClick={generateTemplate}
                className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg
                           transition-colors flex items-center gap-2 text-black"
                disabled={isDisabled}
              >
                {isUploadingToIpfs ? "Uploading..." : "Use Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stage1;
