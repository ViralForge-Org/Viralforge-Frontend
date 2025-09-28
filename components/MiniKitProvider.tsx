"use client";

import { MiniKit } from '@worldcoin/minikit-js';
import { ReactNode, useEffect, createContext, useContext, useState } from 'react';

interface MiniKitContextType {
  isInstalled: boolean;
  isReady: boolean;
}

const MiniKitContext = createContext<MiniKitContextType>({
  isInstalled: false,
  isReady: false,
});

export const useMiniKit = () => useContext(MiniKitContext);

interface MiniKitProviderProps {
  children: ReactNode;
}

export function MiniKitProvider({ children }: MiniKitProviderProps) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Install MiniKit when component mounts
    if (typeof window !== 'undefined') {
      try {
        // This is the key fix - we need to install MiniKit first
        MiniKit.install();

        // Check if we're running inside World App after installation
        const installed = MiniKit.isInstalled();
        setIsInstalled(installed);
        setIsReady(true);

        if (installed) {
          console.log('✅ MiniKit is installed and ready!');
        } else {
          console.log('⚠️ MiniKit not detected - running in browser mode');
        }
      } catch (error) {
        console.error('Failed to install MiniKit:', error);
        setIsInstalled(false);
        setIsReady(true);
      }
    }
  }, []);

  return (
    <MiniKitContext.Provider value={{ isInstalled, isReady }}>
      {children}
    </MiniKitContext.Provider>
  );
}