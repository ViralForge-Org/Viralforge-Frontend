import { TrueApi, testnet } from '@truenetworkio/sdk'
import { TrueConfig } from '@truenetworkio/sdk/dist/utils/cli-config'

// Only import dotenv in Node.js environment
let dotenv: any;
if (typeof window === 'undefined') {
  dotenv = require('dotenv');
  dotenv.config();
}

export const getTrueNetworkInstance = async (): Promise<TrueApi> => {
  // Get secret from environment or browser storage
  const secret = typeof window === 'undefined' 
    ? process.env.TRUE_NETWORK_SECRET_KEY 
    : process.env.NEXT_PUBLIC_TRUE_NETWORK_SECRET_KEY;
    
  if (!secret) {
    throw new Error('TRUE_NETWORK_SECRET_KEY not found');
  }
  
  const trueApi = await TrueApi.create(secret);
  await trueApi.setIssuer(config.issuer.hash);
  return trueApi;
}

export const config: TrueConfig = {
  network: testnet,
  account: {
    address: 'ms9Ec1G7fwWDSiB5L61fceehD4MBmaCR69kJgfKfbvcof2B',
    secret: typeof window === 'undefined' 
      ? process.env.TRUE_NETWORK_SECRET_KEY ?? ''
      : process.env.NEXT_PUBLIC_TRUE_NETWORK_SECRET_KEY ?? ''
  },
  issuer: {
    name: 'FunnyOrFud',
    hash: '0x6b28fd14fe4c919bee18bd75b5cd9cd0898168d264a3d4656ce73fd0138ccba1'
  },
  algorithm: {
    id: undefined,
    path: undefined,
    schemas: []
  },
}