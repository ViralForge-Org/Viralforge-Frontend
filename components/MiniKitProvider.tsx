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
        // Install MiniKit and wait for initialization
        MiniKit.install();

        // Add a small delay to ensure MiniKit is fully initialized
        const checkInstallation = () => {
          try {
            const installed = MiniKit.isInstalled();
            setIsInstalled(installed);
            setIsReady(true);

            if (installed) {
              console.log('✅ MiniKit is installed and ready!');
              console.log('📱 Running inside World App');
            } else {
              console.log('⚠️ MiniKit not detected - running in browser mode');
              console.log('🌐 To use wallet features, please open this app in World App');
            }
          } catch (checkError) {
            console.error('Error checking MiniKit installation:', checkError);
            setIsInstalled(false);
            setIsReady(true);
          }
        };

        // Check immediately and also after a short delay for initialization
        checkInstallation();
        setTimeout(checkInstallation, 100);

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