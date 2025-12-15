'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useConnect, useSendTransaction, usePublicClient } from 'wagmi';
import { CONTRACTS, GM_STREAK_ABI } from '@/lib/web3-config';
import { Button } from '@/components/ui/button';
import { Attribution } from 'ox/erc8021';
import { encodeFunctionData } from 'viem';

export function GMStreak() {
    const { address, isConnected, isConnecting } = useAccount();
    const { connect, connectors } = useConnect();
    const [canGM, setCanGM] = useState(false);
    const [streak, setStreak] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isInFrame, setIsInFrame] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isChecking, setIsChecking] = useState(true);

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
            refetchInterval: 10000, // Check every 10s
        },
    });

    // Read last GM timestamp
    const { data: lastGMData, refetch: refetchLastGM, isLoading: isLastGMLoading } = useReadContract({
        address: CONTRACTS.GM_STREAK_ADDRESS,
        abi: GM_STREAK_ABI,
        functionName: 'getLastGM',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 10000, // Check every 10s
        },
    });

    // Write sayGM transaction (sponsored by Coinbase Paymaster) with Builder Code
    const { sendTransaction, data: txHash, isPending } = useSendTransaction();
    const builderCode = "bc_xvyf9fz7";
    const publicClient = usePublicClient();

    // Wait for transaction
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Helper to check same day UTC
    // 00:00 UTC reset
    const isSameUTCDay = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        return date.getUTCFullYear() === now.getUTCFullYear() &&
            date.getUTCMonth() === now.getUTCMonth() &&
            date.getUTCDate() === now.getUTCDate();
    };

    // Calculate time remaining for next 00:00 UTC
    const calculateTimeRemaining = () => {
        const now = new Date();
        const target = new Date(now);
        // Target is next 00:00 UTC (tomorrow)
        target.setUTCDate(target.getUTCDate() + 1);
        target.setUTCHours(0, 0, 0, 0);

        const diff = target.getTime() - now.getTime();
        if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
        }
        return '';
    };

    const checkLocalStatus = () => {
        if (!address) return false;

        const cacheKey = `gm_streak_last_gm_${address}`;
        const cachedLastGM = localStorage.getItem(cacheKey);

        if (cachedLastGM) {
            const lastGM = Number(cachedLastGM);
            // If cache says we GM'd today, trust it initially for speed
            if (isSameUTCDay(lastGM)) {
                setCanGM(false);
                setTimeRemaining(calculateTimeRemaining());
                setIsChecking(false);
                return true;
            } else {
                // Cache is old, clear it
                localStorage.removeItem(cacheKey);
            }
        }
        return false;
    };

    // Initial load check with LocalStorage
    useEffect(() => {
        if (address) {
            const foundInCache = checkLocalStatus();
            if (!foundInCache) {
                // If not in cache or can GM, we still might want to show loading until contract confirms
                // But if we want to be faster, we can default to TRUE if not found in cache for today?
                // Risk: User GM'd on another device.
                // Safer: Keep loading but timeout??
                // User asked for SPEED.
                // Let's rely on contract for 'true' case, but cache for 'false' case (already GM'd).
            }
        }
    }, [address]);

    useEffect(() => {
        if (streakData) {
            setStreak(Number(streakData));
        }
    }, [streakData]);

    useEffect(() => {
        const updateStatus = () => {
            // Priority 1: Blockchain Data (Source of Truth)
            if (lastGMData !== undefined) {
                const lastGM = Number(lastGMData);

                // Update Cache
                if (address && lastGM > 0) {
                    localStorage.setItem(`gm_streak_last_gm_${address}`, lastGM.toString());
                }

                if (lastGM === 0) {
                    setCanGM(true);
                    setTimeRemaining('');
                } else {
                    const sameDay = isSameUTCDay(lastGM);
                    setCanGM(!sameDay);

                    if (sameDay) {
                        setTimeRemaining(calculateTimeRemaining());
                    } else {
                        setTimeRemaining('');
                    }
                }
                setIsChecking(false);
            }
            // Priority 2: Loading finished but no data (Error or empty)
            else if (!isLastGMLoading) {
                // If streak is 0, it strongly implies no active streak today.
                // We should lean towards unlocking if we aren't 100% sure we are locked.
                if (canGM === false && !timeRemaining && streak === 0) {
                    setCanGM(true);
                }

                setIsChecking(false);
                if (canGM === false && !timeRemaining) {
                    setCanGM(true);
                }
            }
        };

        updateStatus();
        const interval = setInterval(() => {
            // Check if we crossed midnight
            if (lastGMData) {
                const lastGM = Number(lastGMData);
                // If streak is 0, we might want to be more aggressive? 
                // Actually standard logic holds: if not same UTC day, unlock.
                if (!isSameUTCDay(lastGM) && !canGM) {
                    setCanGM(true);
                    setTimeRemaining('');
                    return;
                }
            } else if (streak === 0 && !canGM && !isLastGMLoading) {
                // If we have no lastGM data but streak is 0 and we are not loading... unlock?
                setCanGM(true);
            }

            if (!canGM) { // Only update countdown if we are waiting
                const remaining = calculateTimeRemaining();
                if (!remaining) {
                    // If no time remaining, it means we passed the target
                    // But we should double check next tick or let the above check handle it
                    // Just updating string here
                }
                setTimeRemaining(remaining);
            }
        }, 1000); // Check every second for precision

        return () => clearInterval(interval);
    }, [lastGMData, refetchLastGM, isLastGMLoading, address, canGM, timeRemaining]);

    // Safety timeout to prevent infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isChecking) {
                setIsChecking(false);
                // If we timed out and still can't GM, maybe force enable or check cache?
                if (!canGM && !timeRemaining) {
                    setCanGM(true);
                }
            }
        }, 5000); // 5 seconds max load time
        return () => clearTimeout(timer);
    }, [isChecking, canGM, timeRemaining]);

    useEffect(() => {
        if (isSuccess) {
            setShowSuccess(true);
            setCanGM(false);
            // Optimistic update
            const nowSeconds = Math.floor(Date.now() / 1000);
            if (address) {
                localStorage.setItem(`gm_streak_last_gm_${address}`, nowSeconds.toString());
            }
            setTimeRemaining(calculateTimeRemaining());

            refetchStreak();
            refetchLastGM();
            setTimeout(() => setShowSuccess(false), 3000);
        }
    }, [isSuccess, refetchStreak, refetchLastGM, address]);

    const handleGM = async () => {
        if (!canGM || !isConnected || !publicClient || !address) return;

        try {
            // Encode function data
            const encodedData = encodeFunctionData({
                abi: GM_STREAK_ABI,
                functionName: 'sayGM'
            });

            // Generate attribution suffix
            const dataSuffix = Attribution.toDataSuffix({
                codes: [builderCode]
            });

            // Append suffix
            const dataWithSuffix = (encodedData + dataSuffix.slice(2)) as `0x${string}`;

            // 1. Simulate Check
            try {
                await publicClient.call({
                    account: address,
                    to: CONTRACTS.GM_STREAK_ADDRESS,
                    data: dataWithSuffix
                });
            } catch (simError: any) {
                console.log('Simulation failed:', simError);
                // If simulation fails with the specific error, we know they already GM'd
                if (simError?.message?.includes('Daha yeni GM dedin') ||
                    JSON.stringify(simError).includes('Daha yeni GM dedin')) {

                    // Update local state immediately
                    setCanGM(false);
                    const nowSeconds = Math.floor(Date.now() / 1000);
                    localStorage.setItem(`gm_streak_last_gm_${address}`, nowSeconds.toString());
                    setTimeRemaining(calculateTimeRemaining());
                    refetchLastGM();
                    return; // Stop execution, don't open wallet
                }
            }

            console.log('Sending transaction with builder code:', builderCode);

            sendTransaction({
                to: CONTRACTS.GM_STREAK_ADDRESS,
                data: dataWithSuffix
            });
        } catch (error: any) {
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
                            Daily Check-in
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
                        disabled={!canGM || isPending || isConfirming || isChecking}
                        className={`${canGM && !isChecking
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                            : 'bg-gray-300 dark:bg-gray-700'
                            } text-white font-bold px-6 min-w-[150px]`}
                    >
                        {isChecking ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Loading...
                            </span>
                        ) : isPending || isConfirming ? (
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

            {/* Streak Badge Row - Below everything */}
            <div className="flex justify-center mt-3 border-t border-yellow-200 dark:border-yellow-800 pt-2">
                <div className="bg-white/50 dark:bg-black/20 px-4 py-1.5 rounded-full flex items-center gap-2 border border-yellow-200 dark:border-yellow-800">
                    <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">CURRENT STREAK</span>
                    <div className="flex items-center gap-1">
                        <span className="text-sm">🔥</span>
                        <span className="text-xl font-black text-yellow-800 dark:text-yellow-300 leading-none">{streak}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
