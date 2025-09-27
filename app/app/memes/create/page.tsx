"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTrueNetworkInstance } from "@/true-network/true.config";
import { TrueApi } from "@truenetworkio/sdk";
import Stage1 from "@/components/meme-creator/Stage1";
import Stage2 from "@/components/meme-creator/Stage2";
import Stage3 from "@/components/meme-creator/Stage3";
import { LoadingOverlay } from "@/components/meme-creator/LoadingOverlay";
import type { TextBox } from "@/components/meme-creator/types";

const MemeCreator: React.FC = () => {
  const [stage, setStage] = useState(1);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [finalMeme, setFinalMeme] = useState<string | null>(null);
  const [trueApi, setTrueApi] = useState<TrueApi>();
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [memeTemplate, setmemeTemplate] = useState(0);

  useEffect(() => {
    const setupapi = async () => {
      const api = await getTrueNetworkInstance();
      setTrueApi(api);
    };
    setupapi();
  }, []);

  const RenderCurrentStage = () => {
    switch (stage) {
      case 1:
        return (
          <Stage1
            setCapturedImage={setCapturedImage}
            capturedImage={capturedImage}
            setStage={setStage}
            setIsLoading={setIsLoading}
            setLoadingMessage={setLoadingMessage}
            trueApi={trueApi}
            setmemeTemplate={setmemeTemplate}
          />
        );
      case 2: {
        if (!capturedImage) {
          return null;
        }
        return (
          <Stage2
            capturedImage={capturedImage}
            textBoxes={textBoxes}
            setTextBoxes={setTextBoxes}
            imageContainerRef={imageContainerRef}
            setFinalMeme={setFinalMeme}
            setStage={setStage}
            setIsLoading={setIsLoading}
            setLoadingMessage={setLoadingMessage}
            trueApi={trueApi}
            memeTemplate={memeTemplate}
          />
        );
      }
      case 3:
        return (
          <Stage3
            finalMeme={finalMeme}
            setStage={setStage}
            setFinalMeme={setFinalMeme}
            shareText="Check out this meme I created with ViralForge! 🎨"
          />
        );
      default:
        return null;
    }
  };

  // Effect to handle stage transitions
  useEffect(() => {
    if (stage === 2 && !capturedImage) {
      setStage(1);
    }
  }, [stage, capturedImage]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <AnimatePresence>
        {isLoading && <LoadingOverlay message={loadingMessage} />}
      </AnimatePresence>
      <div className="w-full max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          {RenderCurrentStage()}
        </motion.div>
      </div>
    </div>
  );
};

export default MemeCreator;