'use client';

import { createConfig, http, WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';
import { PAYMASTER_URL } from '@/lib/web3-config';

// Base chain with Coinbase Paymaster
const baseWithPaymaster = {
    ...base,
    rpcUrls: {
        default: {
            http: [PAYMASTER_URL],
        },
        public: {
            http: ['https://mainnet.base.org'],
        },
    },
};

// Create wagmi config with Farcaster Frame connector and Paymaster
const config = createConfig({
    chains: [baseWithPaymaster],
    transports: {
        [base.id]: http(PAYMASTER_URL),
    },
    connectors: [
        farcasterFrame(),
    ],
});

export function Web3Provider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}

// Export config for use in hooks
export { config };
