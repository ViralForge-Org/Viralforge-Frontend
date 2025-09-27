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
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-red-100 text-gray-900 relative overflow-hidden">
      {/* Comic Dot Pattern Background */}
      <div className="absolute inset-0 opacity-30"
           style={{
             backgroundImage: `radial-gradient(circle, #ff6b6b 1px, transparent 1px)`,
             backgroundSize: '20px 20px'
           }} />

      {/* Comic Style Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['CREATE!', 'EDIT!', 'SHARE!', '🎨', '✨'].map((text, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl font-bold text-blue-400 opacity-20"
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
              duration: Math.random() * 40 + 30,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {text}
          </motion.div>
        ))}
      </div>

      {/* Navigation */}

      {/* Header */}
      <div className="relative pt-20 pb-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-red-600 mb-4 transform -rotate-2 mt-6"
              style={{
                textShadow: '4px 4px 0px #ffeb3b, -2px -2px 0px #ff5722',
                fontFamily: 'Comic Sans MS, cursive'
              }}>
            VIRALFORGE! 🎨
          </h1>
          <p className="text-gray-700 text-lg font-bold">
            Create your epic meme in 3 simple steps! 💥
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isLoading && <LoadingOverlay message={loadingMessage} />}
      </AnimatePresence>

      <div className="relative w-full max-w-2xl mx-auto px-4 pb-20">
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