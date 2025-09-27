// components/ui/sticky-scroll-reveal.tsx
"use client";
import React from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import Image from "next/image";

interface Content {
  title: string;
  description: string;
  image?: string; // Optional image URL
}

export const StickyScroll = ({ content }: { content: Content[] }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Create individual components to avoid hooks in callbacks
  const ContentItem = ({ item, index }: { item: Content; index: number }) => {
    const opacity = useTransform(
      scrollYProgress,
      [
        index / (content.length + 0.5),
        (index + 0.2) / (content.length + 0.5),
        (index + 0.8) / (content.length + 0.5),
        (index + 1) / (content.length + 0.5),
      ],
      [0, 1, 1, 0]
    );

    return (
      <motion.div
        key={item.title}
        initial={{ opacity: 0 }}
        style={{ opacity: opacity as MotionValue<number> }}
        className="absolute top-0 left-0 w-full flex justify-center"
      >
        <div className="bg-card/40 backdrop-blur-sm p-8 rounded-xl border border-border max-w-lg">
          <h3 className="text-2xl font-bold text-card-foreground mb-4">
            {item.title}
          </h3>
          <p className="text-muted-foreground">
            {item.description}
          </p>
        </div>
      </motion.div>
    );
  };

  const ImageItem = ({ item, index }: { item: Content; index: number }) => {
    const opacity = useTransform(
      scrollYProgress,
      [
        index / (content.length + 0.5),
        (index + 0.2) / (content.length + 0.5),
        (index + 0.8) / (content.length + 0.5),
        (index + 1) / (content.length + 0.5),
      ],
      [0, 1, 1, 0]
    );

    const translateY = useTransform(
      scrollYProgress,
      [
        index / (content.length + 0.5),
        (index + 1) / (content.length + 0.5),
      ],
      [50, -50]
    );

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0 }}
        style={{
          opacity: opacity as MotionValue<number>,
          y: translateY,
        }}
        className="absolute top-0 left-0 w-full h-full"
      >
        <div className="w-full h-full rounded-xl overflow-hidden bg-accent/10">
          {item.image ? (
            <div className="relative w-full h-full">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-accent/10">
              <motion.div
                className="w-20 h-20 bg-accent/20 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      ref={containerRef}
      className="relative h-[300vh] bg-gradient-to-b from-secondary to-background"
    >
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="absolute w-full">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center justify-center">
              {/* Left side content */}
              <div className="relative h-[40vh] md:h-[50vh] flex items-center justify-center">
                {content.map((item, index) => (
                  <ContentItem key={item.title} item={item} index={index} />
                ))}
              </div>

              {/* Right side images */}
              <div className="relative h-[40vh] md:h-[50vh]">
                {content.map((item, index) => (
                  <ImageItem key={index} item={item} index={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
