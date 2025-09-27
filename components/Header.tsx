"use client";

import React, { useEffect, useState } from "react";
import { LogOut, Plus } from "lucide-react";
import { useWorldApp } from "@/hooks/useWorldApp";
import { giveGas } from "@/lib/utils";

// MobileNav component remains largely the same
const MobileNav: React.FC<{
  isOpen: boolean;
}> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-40">
      <div className="p-4 flex justify-between items-center border-b">
        <h1 className="text-2xl font-black text-red-600 cursor-pointer transform hover:scale-105 transition-all duration-300"
            style={{
              fontFamily: 'Comic Sans MS, cursive',
              textShadow: '3px 3px 0px #ffeb3b, -1px -1px 0px #000'
            }}
            onClick={() => window.location.href = '/'} >ViralForge</h1>
      </div>
    </div>
  );
};

const Header: React.FC = () => {
  const [isMobileMenuOpen] = useState(false);
  const { user, connectWallet, disconnectWallet, isConnected, walletAddress, isMiniApp } = useWorldApp();

  useEffect(() => {
    if (walletAddress) giveGas(walletAddress as string);
  }, [isConnected, walletAddress]);

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : "";

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <header className="bg-background text-foreground p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo and Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          <h1 className="text-2xl font-black text-red-600 cursor-pointer transform hover:scale-105 transition-all duration-300"
              style={{
                fontFamily: 'Comic Sans MS, cursive',
                textShadow: '3px 3px 0px #ffeb3b, -1px -1px 0px #000'
              }}
              onClick={() => window.location.href = '/'}>ViralForge</h1>
        </div>

        {/* Mobile Logo (centered) */}
        <h1 className="text-2xl font-black text-red-600 cursor-pointer transform hover:scale-105 transition-all duration-300 lg:hidden"
            style={{
              fontFamily: 'Comic Sans MS, cursive',
              textShadow: '3px 3px 0px #ffeb3b, -1px -1px 0px #000'
            }}
            onClick={() => window.location.href = '/'}>ViralForge</h1>

        {/* Wallet Controls */}
        <div className="flex items-center gap-2 sm:gap-4 justify-center">
          {isConnected ? (
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={disconnectWallet}
                className="bg-yellow-300 hover:bg-yellow-400 border-4 border-black px-2 sm:px-4 py-2 rounded-xl flex items-center gap-1 sm:gap-2 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base font-black text-black shadow-xl"
              >
                <span>{truncatedAddress}</span>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="bg-red-500 hover:bg-red-600 border-4 border-black text-white px-4 py-2 rounded-xl font-black transition-all duration-300 transform hover:scale-105 shadow-xl uppercase"
            >
              🌍 Connect Wallet
            </button>
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
