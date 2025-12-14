'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { Web3Provider } from './Web3Provider';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Web3Provider>
                {children}
            </Web3Provider>
        </ThemeProvider>
    );
}
