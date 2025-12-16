'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, encodeFunctionData } from 'viem';
import { Attribution } from 'ox/erc8021';
import { Button } from '@/components/ui/button';
import { CONTRACTS } from '@/lib/web3-config';
import { activatePremium, PREMIUM_PRICE_ETH, BUILDER_CODE } from '@/lib/premium';

interface PremiumUnlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    hiddenCount: number;
}

export function PremiumUnlockModal({ isOpen, onClose, onSuccess, hiddenCount }: PremiumUnlockModalProps) {
    const { address, isConnected } = useAccount();
    const [isPaying, setIsPaying] = useState(false);

    const { sendTransaction, data: txHash, isPending } = useSendTransaction();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Handle successful payment
    useEffect(() => {
        if (isSuccess && address) {
            activatePremium(address);
            setIsPaying(false);
            onSuccess();
            onClose();
        }
    }, [isSuccess, address, onSuccess, onClose]);

    const handlePayment = async () => {
        if (!isConnected || !address) return;

        setIsPaying(true);

        try {
            // Generate builder code attribution suffix
            const dataSuffix = Attribution.toDataSuffix({
                codes: [BUILDER_CODE]
            });

            // Send ETH with builder code
            sendTransaction({
                to: CONTRACTS.TIP_ADDRESS,
                value: parseEther(PREMIUM_PRICE_ETH),
                data: dataSuffix as `0x${string}`,
            });
        } catch (error) {
            console.error('Payment failed:', error);
            setIsPaying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white text-center">
                    <div className="text-4xl mb-2">🔓</div>
                    <h2 className="text-2xl font-bold">Unlock Full Access</h2>
                    <p className="text-purple-100 text-sm mt-1">See everyone who unfollowed you</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-600 dark:text-gray-400">Hidden users:</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">{hiddenCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-600 dark:text-gray-400">Access duration:</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">30 days</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Price:</span>
                            <div className="text-right">
                                <span className="font-bold text-purple-600 dark:text-purple-400">{PREMIUM_PRICE_ETH} ETH</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block">≈ $0.50</span>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="text-green-500">✓</span>
                            <span>See all {hiddenCount.toLocaleString()} hidden users</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="text-green-500">✓</span>
                            <span>Full access for 30 days</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="text-green-500">✓</span>
                            <span>No hidden fees, one-time payment</span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={handlePayment}
                            disabled={isPending || isConfirming || isPaying || !isConnected}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3"
                        >
                            {(isPending || isConfirming || isPaying) ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </span>
                            ) : (
                                `✨ Unlock Now - ${PREMIUM_PRICE_ETH} ETH`
                            )}
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="w-full"
                            disabled={isPending || isConfirming}
                        >
                            Maybe Later
                        </Button>
                    </div>

                    {!isConnected && (
                        <p className="text-center text-sm text-red-500 mt-4">
                            Please connect your wallet first
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
