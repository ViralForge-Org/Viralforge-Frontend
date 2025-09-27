import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'

// Define World Chain Sepolia testnet
const worldChainTestnet = defineChain({
  id: 4801,
  name: 'World Chain Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://worldchain-sepolia.g.alchemy.com/public'],
    },
  },
  blockExplorers: {
    default: {
      name: 'World Chain Sepolia Explorer',
      url: 'https://worldchain-sepolia.blockscout.com',
    },
  },
})

export const config = createConfig({
  chains: [worldChainTestnet],
  transports: {
    [worldChainTestnet.id]: http(),
  },
})

// Export the chain for use in MiniKit
export { worldChainTestnet }