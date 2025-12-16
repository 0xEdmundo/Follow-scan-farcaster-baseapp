// Premium and Cache utilities for Follow Scan
// Manages premium status and daily scan cache

const PREMIUM_DURATION_DAYS = 30;
const CACHE_KEY_PREFIX = 'followscan_cache_';
const PREMIUM_KEY_PREFIX = 'followscan_premium_';

// ============= PREMIUM MANAGEMENT =============

export interface PremiumStatus {
    isActive: boolean;
    expiresAt: number | null; // Unix timestamp
    daysRemaining: number;
}

/**
 * Check if user has active premium subscription
 */
export function getPremiumStatus(address: string): PremiumStatus {
    if (!address) {
        return { isActive: false, expiresAt: null, daysRemaining: 0 };
    }

    const key = `${PREMIUM_KEY_PREFIX}${address.toLowerCase()}`;
    const stored = localStorage.getItem(key);

    if (!stored) {
        return { isActive: false, expiresAt: null, daysRemaining: 0 };
    }

    const expiresAt = Number(stored);
    const now = Date.now();
    const isActive = expiresAt > now;
    const daysRemaining = isActive ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)) : 0;

    return { isActive, expiresAt, daysRemaining };
}

/**
 * Activate premium for user (30 days from now)
 */
export function activatePremium(address: string): void {
    if (!address) return;

    const key = `${PREMIUM_KEY_PREFIX}${address.toLowerCase()}`;
    const expiresAt = Date.now() + (PREMIUM_DURATION_DAYS * 24 * 60 * 60 * 1000);
    localStorage.setItem(key, expiresAt.toString());
}

/**
 * Check if premium is active (simple boolean check)
 */
export function isPremiumActive(address: string): boolean {
    return getPremiumStatus(address).isActive;
}

// ============= DAILY CACHE MANAGEMENT =============

export interface CachedScanData {
    timestamp: number; // Unix timestamp (seconds)
    fid: number;
    followers: any[];
    following: any[];
    notFollowingBack: any[];
    mutualFollows: any[];
    youDontFollow: any[];
    totalFollowers: number;
    totalFollowing: number;
}

/**
 * Check if today's cache exists for this FID
 */
export function hasTodayCache(fid: number): boolean {
    const cached = getCachedData(fid);
    if (!cached) return false;

    return isSameUTCDay(cached.timestamp);
}

/**
 * Get cached scan data for FID
 */
export function getCachedData(fid: number): CachedScanData | null {
    const key = `${CACHE_KEY_PREFIX}${fid}`;
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    try {
        return JSON.parse(stored) as CachedScanData;
    } catch {
        return null;
    }
}

/**
 * Save scan data to cache
 */
export function saveCacheData(data: CachedScanData): void {
    const key = `${CACHE_KEY_PREFIX}${data.fid}`;
    localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Get time remaining until next scan is allowed
 */
export function getTimeUntilNextScan(fid: number): string {
    const cached = getCachedData(fid);
    if (!cached) return '';

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
}

/**
 * Get formatted last update time
 */
export function getLastUpdateTime(fid: number): string {
    const cached = getCachedData(fid);
    if (!cached) return '';

    const cacheDate = new Date(cached.timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - cacheDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m ago`;
    }
    return `${diffMinutes}m ago`;
}

// ============= HELPER FUNCTIONS =============

/**
 * Check if timestamp is from same UTC day as now
 */
function isSameUTCDay(timestampSeconds: number): boolean {
    const date = new Date(timestampSeconds * 1000);
    const now = new Date();

    return date.getUTCFullYear() === now.getUTCFullYear() &&
        date.getUTCMonth() === now.getUTCMonth() &&
        date.getUTCDate() === now.getUTCDate();
}

// ============= CONSTANTS =============

export const VISIBLE_FREE_USERS = 30; // Number of users shown without blur
export const MAX_API_RESULTS = 2500; // Maximum results from API
export const PREMIUM_PRICE_ETH = '0.0002'; // ~$0.50 @ $2500/ETH
export const BUILDER_CODE = 'bc_xvyf9fz7';
