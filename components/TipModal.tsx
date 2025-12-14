'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useSendTransaction, useWaitForTransactionReceipt, useConnect } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { CONTRACTS, ERC20_ABI } from '@/lib/web3-config';
import { Button } from '@/components/ui/button';

interface TipModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TipModal({ isOpen, onClose }: TipModalProps) {
    const { address, isConnected, isConnecting } = useAccount();
    const { connect, connectors } = useConnect();
    const [currency, setCurrency] = useState<'ETH' | 'USDC'>('ETH');
    const [amount, setAmount] = useState('0.001');
    const [customAmount, setCustomAmount] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    // Auto-connect in frame context
    useEffect(() => {
        if (isOpen && !isConnected && !isConnecting && connectors.length > 0) {
            const farcasterConnector = connectors.find(c =>
                c.name.toLowerCase().includes('farcaster') ||
                c.id === 'farcasterFrame'
            );
            if (farcasterConnector) {
                try {
                    connect({ connector: farcasterConnector });
                } catch (e) {
                    console.log('Auto-connect failed');
                }
            }
        }
    }, [isOpen, isConnected, isConnecting, connectors, connect]);

    // Send ETH transaction
    const { sendTransaction, data: ethTxHash, isPending: isEthPending } = useSendTransaction();

    // Send USDC transaction
    const { writeContract, data: usdcTxHash, isPending: isUsdcPending } = useWriteContract();

    // Wait for transaction
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: ethTxHash || usdcTxHash,
    });

    const isPending = isEthPending || isUsdcPending;

    const handleTip = async () => {
        if (!isConnected) return;

        const tipAmount = customAmount || amount;

        try {
            if (currency === 'ETH') {
                sendTransaction({
                    to: CONTRACTS.TIP_ADDRESS,
                    value: parseEther(tipAmount),
                });
            } else {
                writeContract({
                    address: CONTRACTS.USDC_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: 'transfer',
                    args: [CONTRACTS.TIP_ADDRESS, parseUnits(tipAmount, 6)],
                });
            }
        } catch (error) {
            console.error('Tip failed:', error);
        }
    };

    useEffect(() => {
        if (isSuccess && !showSuccess) {
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                onClose();
            }, 2000);
        }
    }, [isSuccess, showSuccess, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {showSuccess ? (
                    <div className="text-center py-8">
                        <span className="text-6xl mb-4 block">💜</span>
                        <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">Thank You!</h2>
                        <p className="text-gray-600 dark:text-gray-300">Your support means a lot!</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <span className="text-4xl mb-2 block">☕</span>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Support the Developer</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                If you enjoy Follow Scan, consider buying me a coffee!
                            </p>
                        </div>

                        {isConnecting ? (
                            <div className="text-center py-4">
                                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-gray-500 dark:text-gray-400">Connecting wallet...</p>
                            </div>
                        ) : !isConnected ? (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                                <p className="mb-2">Open in Farcaster to tip</p>
                                <p className="text-xs">Wallet will auto-connect</p>
                            </div>
                        ) : (
                            <>
                                {/* Currency Toggle */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => {
                                            setCurrency('ETH');
                                            setAmount('0.001');
                                        }}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${currency === 'ETH'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                            }`}
                                    >
                                        ETH
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCurrency('USDC');
                                            setAmount('1');
                                        }}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${currency === 'USDC'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                            }`}
                                    >
                                        USDC
                                    </button>
                                </div>

                                {/* Preset Amounts */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {(currency === 'ETH' ? ['0.001', '0.005', '0.01'] : ['1', '5', '10']).map((preset) => (
                                        <button
                                            key={preset}
                                            onClick={() => {
                                                setAmount(preset);
                                                setCustomAmount('');
                                            }}
                                            className={`py-2 px-3 rounded-lg font-medium transition-all ${amount === preset && !customAmount
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {preset} {currency}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Amount */}
                                <div className="mb-4">
                                    <input
                                        type="number"
                                        placeholder={`Custom amount (${currency})`}
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        step={currency === 'ETH' ? '0.001' : '1'}
                                        min="0"
                                    />
                                </div>

                                {/* Send Button */}
                                <Button
                                    onClick={handleTip}
                                    disabled={isPending || isConfirming}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3"
                                >
                                    {isPending || isConfirming ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Sending...
                                        </span>
                                    ) : (
                                        `Send ${customAmount || amount} ${currency} 💜`
                                    )}
                                </Button>
                            </>
                        )}

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="w-full mt-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
                        >
                            Maybe Later
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
