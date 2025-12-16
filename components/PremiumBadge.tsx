'use client';

import { getPremiumStatus } from '@/lib/premium';

interface PremiumBadgeProps {
    address: string | undefined;
}

export function PremiumBadge({ address }: PremiumBadgeProps) {
    if (!address) return null;

    const status = getPremiumStatus(address);

    if (!status.isActive) return null;

    return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 rounded-full border border-amber-300 dark:border-amber-700">
            <span className="text-sm">⭐</span>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Premium
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">
                • {status.daysRemaining}d left
            </span>
        </div>
    );
}
