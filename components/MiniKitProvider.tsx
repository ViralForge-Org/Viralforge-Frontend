"use client";

import { MiniKit } from '@worldcoin/minikit-js';
import { ReactNode, useEffect } from 'react';

interface MiniKitProviderProps {
  children: ReactNode;
}

export function MiniKitProvider({ children }: MiniKitProviderProps) {
  useEffect(() => {
    // Initialize MiniKit when component mounts
    if (typeof window !== 'undefined') {
      // Check if we're running inside World App
      if (MiniKit.isInstalled()) {
        console.log('MiniKit is installed and ready!');
      } else {
        console.log('MiniKit not detected - running in browser mode');
      }
    }
  }, []);

  return <>{children}</>;
}