"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/config/wagmiConfig";
import { MetaMaskUIProvider } from "@metamask/sdk-react-ui";
import { MiniKitProvider } from "@/components/MiniKitProvider";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MiniKitProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <MetaMaskUIProvider
            sdkOptions={{
              dappMetadata: {
                name: "ViralForge - Meme Voting App",
              },
            }}
          >
            {children}
          </MetaMaskUIProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MiniKitProvider>
  );
}
