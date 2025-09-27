"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { LogOut, Plus } from "lucide-react";
import { MetaMaskButton } from "@metamask/sdk-react-ui";
import { giveGas } from "@/lib/utils";

// MobileNav component remains largely the same
const MobileNav: React.FC<{
  isOpen: boolean;
}> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-40">
      <div className="p-4 flex justify-between items-center border-b">
        <h1 className="text-2xl font-bold" onClick={() => window.location.href = '/'} >ViralForge</h1>
      </div>
    </div>
  );
};

const Header: React.FC = () => {
  const [isMobileMenuOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { chains, switchChain } = useSwitchChain();


  const addChain = async () => {
  if (chains) {
    if (window.ethereum)
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x12C1", // World Chain Sepolia testnet chain ID
            chainName: "World Chain Sepolia",
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: ["https://worldchain-sepolia.g.alchemy.com/public"],
            blockExplorerUrls: ["https://worldchain-sepolia.blockscout.com"],
          },
        ],
      });
    switchChain({ chainId: 4801 }); // World Chain Sepolia testnet chain ID
  }
};

  useEffect(() => {
    if (address) giveGas(address as string);
  }, [isConnected, address]);



  const truncatedAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : "";

  return (
    <header className="bg-background text-foreground p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo and Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          <h1 className="text-2xl font-bold" onClick={() => window.location.href = '/'}>ViralForge</h1>
        </div>

        {/* Mobile Logo (centered) */}
        <h1 className="text-2xl font-bold lg:hidden" onClick={() => window.location.href = '/'}>ViralForge</h1>

        {/* Wallet Controls */}
        <div className="flex items-center gap-2 sm:gap-4 justify-center">
          {isConnected ? (
            <>
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="bg-card hover:bg-card/80 px-2 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 transition duration-200 text-sm sm:text-base"
                >
                  <span>{truncatedAddress}</span>
                  <LogOut className="w-4 h-4" />
                </button>

                <button onClick={addChain}>
                  <Plus />
                </button>
              </div>
            </>
          ) : (
            <MetaMaskButton theme={"light"} color="white"></MetaMaskButton>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <MobileNav
        isOpen={isMobileMenuOpen}
      />
    </header>
  );
};

export default Header;
