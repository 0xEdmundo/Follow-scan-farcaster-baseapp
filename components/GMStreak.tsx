'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useConnect } from 'wagmi';
import { CONTRACTS, GM_STREAK_ABI } from '@/lib/web3-config';
import { Button } from '@/components/ui/button';

export function GMStreak() {
    const { address, isConnected, isConnecting } = useAccount();
    const { connect, connectors } = useConnect();
    const [canGM, setCanGM] = useState(true);
    const [streak, setStreak] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isInFrame, setIsInFrame] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<string>('');

    // Auto-connect wallet in Farcaster/Base context
    useEffect(() => {
        const autoConnect = async () => {
            // Check if we're in a Farcaster frame
            const inFrame = typeof window !== 'undefined' && (
                window.parent !== window ||
                window.location.search.includes('fid=') ||
                navigator.userAgent.includes('Warpcast')
            );
            setIsInFrame(inFrame);

            if (!isConnected && !isConnecting && connectors.length > 0) {
                // Try Farcaster connector first
                const farcasterConnector = connectors.find(c =>
                    c.name.toLowerCase().includes('farcaster') ||
                    c.id === 'farcasterFrame'
                );

                if (farcasterConnector) {
                    try {
                        connect({ connector: farcasterConnector });
                    } catch (e) {
                        console.log('Auto-connect failed, user may need to manually connect');
                    }
                }
            }
        };

        autoConnect();
    }, [isConnected, isConnecting, connectors, connect]);

    // Read current streak
    const { data: streakData, refetch: refetchStreak } = useReadContract({
        address: CONTRACTS.GM_STREAK_ADDRESS,
        abi: GM_STREAK_ABI,
        functionName: 'getStreak',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    });

    // Read last GM timestamp
    const { data: lastGMData, refetch: refetchLastGM } = useReadContract({
        address: CONTRACTS.GM_STREAK_ADDRESS,
        abi: GM_STREAK_ABI,
        functionName: 'getLastGM',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    });

    // Write sayGM transaction (sponsored by Coinbase Paymaster)
    const { writeContract, data: txHash, isPending } = useWriteContract();

    // Wait for transaction
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    useEffect(() => {
        if (streakData) {
            setStreak(Number(streakData));
        }
    }, [streakData]);

    useEffect(() => {
        const updateStatus = () => {
            if (lastGMData) {
                const lastGM = Number(lastGMData);
                if (lastGM === 0) {
                    setCanGM(true);
                    setTimeRemaining('');
                } else {
                    const lastGMDate = new Date(lastGM * 1000);
                    const now = new Date();

                    const isSameDay =
                        lastGMDate.getUTCFullYear() === now.getUTCFullYear() &&
                        lastGMDate.getUTCMonth() === now.getUTCMonth() &&
                        lastGMDate.getUTCDate() === now.getUTCDate();

                    setCanGM(!isSameDay);

                    if (isSameDay) {
                        const tomorrow = new Date();
                        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
                        tomorrow.setUTCHours(0, 0, 0, 0);

                        const diff = tomorrow.getTime() - now.getTime();
                        if (diff > 0) {
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                            setTimeRemaining(`${hours}h ${minutes}m`);
                        } else {
                            refetchLastGM();
                        }
                    } else {
                        setTimeRemaining('');
                    }
                }
            }
        };

        updateStatus();
        const interval = setInterval(updateStatus, 60000);
        return () => clearInterval(interval);
    }, [lastGMData, refetchLastGM]);

    useEffect(() => {
        if (isSuccess) {
            setShowSuccess(true);
            setCanGM(false);
            refetchStreak();
            refetchLastGM();
            setTimeout(() => setShowSuccess(false), 3000);
        }
    }, [isSuccess, refetchStreak, refetchLastGM]);

    const handleGM = async () => {
        if (!canGM || !isConnected) return;

        try {
            writeContract({
                address: CONTRACTS.GM_STREAK_ADDRESS,
                abi: GM_STREAK_ABI,
                functionName: 'sayGM',
            });
        } catch (error) {
            console.error('GM failed:', error);
        }
    };

    // Show loading while connecting
    if (isConnecting) {
        return (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border-2 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-yellow-800 dark:text-yellow-300 font-medium">Connecting wallet...</p>
                </div>
            </div>
        );
    }

    // If not connected and not in frame, show minimal message
    if (!isConnected) {
        return (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border-2 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">☀️</span>
                        <div>
                            <p className="font-bold text-yellow-800 dark:text-yellow-300">GM Streak</p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                {isInFrame ? 'Loading...' : 'Open in Farcaster to use'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border-2 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">☀️</span>
                    <div>
                        <p className="font-bold text-yellow-800 dark:text-yellow-300">GM Streak</p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            {streak > 0 ? `🔥 ${streak} day${streak > 1 ? 's' : ''} streak!` : 'Start your streak!'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {showSuccess && (
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium animate-pulse">
                            ✓ GM sent!
                        </span>
                    )}
                    <Button
                        onClick={handleGM}
                        disabled={!canGM || isPending || isConfirming}
                        className={`${canGM
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                            : 'bg-gray-300 dark:bg-gray-700'
                            } text-white font-bold px-6 min-w-[150px]`}
                    >
                        {isPending || isConfirming ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Sending...
                            </span>
                        ) : canGM ? (
                            'Say GM ☀️'
                        ) : (
                            timeRemaining ? `Next: ${timeRemaining}` : 'GM Sent ✓'
                        )}
                    </Button>
                </div>
            </div>
            {canGM && isConnected && (
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2 text-center">
                    ⛽ Free transaction - gas sponsored!
                </p>
            )}
        </div>
    );
}
