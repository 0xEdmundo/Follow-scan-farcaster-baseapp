'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GMStreak } from '@/components/GMStreak';
import { TipModal } from '@/components/TipModal';
import { useAccount, useConnect } from 'wagmi';



interface UserProfile {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
    followerCount: number;
    followingCount: number;
    neynarScore: number;
    powerBadge: boolean;
}

interface FollowScanProps {
    initialFid: number;
}

type SortOption = 'username' | 'followers' | 'fid' | 'score';
type TabOption = 'notFollowingBack' | 'mutualFollows' | 'youDontFollow';

export function FollowScan({ initialFid }: FollowScanProps) {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [followers, setFollowers] = useState<UserProfile[]>([]);
    const [following, setFollowing] = useState<UserProfile[]>([]);
    const [notFollowingBack, setNotFollowingBack] = useState<UserProfile[]>([]);
    const [mutualFollows, setMutualFollows] = useState<UserProfile[]>([]);
    const [youDontFollow, setYouDontFollow] = useState<UserProfile[]>([]);
    const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
    const [hasScanned, setHasScanned] = useState<boolean>(false);
    const [dataError, setDataError] = useState<string>('');
    const [sortBy, setSortBy] = useState<SortOption>('score');
    const [activeTab, setActiveTab] = useState<TabOption>('notFollowingBack');
    const [showTipModal, setShowTipModal] = useState(false);

    // Auto-connect wallet
    useEffect(() => {
        if (!isConnected && connectors.length > 0) {
            // Try to auto-connect with first available connector
            const farcasterConnector = connectors.find(c => c.name.toLowerCase().includes('farcaster'));
            if (farcasterConnector) {
                connect({ connector: farcasterConnector });
            }
        }
    }, [isConnected, connectors, connect]);

    useEffect(() => {
        loadUserProfile(initialFid);
    }, [initialFid]);



    const loadUserProfile = async (fid: number): Promise<void> => {
        setIsLoadingProfile(true);

        try {
            console.log('[FollowScan] Loading user profile...');
            const response = await fetch(`/api/farcaster/user?fid=${fid}`);
            const data = await response.json();

            if (data.user) {
                setUser({
                    fid: data.user.fid,
                    username: data.user.username,
                    displayName: data.user.displayName,
                    pfpUrl: data.user.pfpUrl,
                    followerCount: data.user.followerCount,
                    followingCount: data.user.followingCount,
                    neynarScore: data.user.neynarScore || 0,
                    powerBadge: data.user.powerBadge || false
                });
                console.log('[FollowScan] ✅ User profile loaded');
            } else {
                console.error('[FollowScan] User not found');
                setUser(null);
            }
        } catch (err) {
            console.error('[FollowScan] Failed to load user profile:', err);
            setUser(null);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const scanFollowData = async (): Promise<void> => {
        if (!user) {
            console.error('[FollowScan] No user profile loaded');
            return;
        }

        setIsLoadingData(true);
        setDataError('');
        console.log('[FollowScan] 🚀 Starting follow data scan...');

        try {
            const [followersResponse, followingResponse] = await Promise.all([
                fetch(`/api/farcaster/followers?fid=${initialFid}`),
                fetch(`/api/farcaster/following?fid=${initialFid}`)
            ]);

            const followersData = await followersResponse.json();
            const followingData = await followingResponse.json();

            console.log('[FollowScan] Followers response:', followersData);
            console.log('[FollowScan] Following response:', followingData);

            const userFollowers = Array.isArray(followersData.followers) ? followersData.followers : [];
            const userFollowing = Array.isArray(followingData.following) ? followingData.following : [];

            // Debug: Check first item structure
            if (userFollowers.length > 0) {
                console.log('[FollowScan] DEBUG - First follower raw:', userFollowers[0]);
                console.log('[FollowScan] DEBUG - First follower fid:', userFollowers[0].fid);
            }

            // Map followers - handle both direct and nested user object
            const mappedFollowers: UserProfile[] = userFollowers.map((item: any) => {
                // Neynar might return { user: {...} } or directly {...}
                const u = item.user || item;
                return {
                    fid: u.fid,
                    username: u.username || 'unknown',
                    displayName: u.display_name || u.displayName || u.username || 'Unknown',
                    pfpUrl: u.pfp_url || u.pfpUrl || 'https://via.placeholder.com/150',
                    followerCount: u.follower_count || u.followerCount || 0,
                    followingCount: u.following_count || u.followingCount || 0,
                    neynarScore: u.experimental?.neynar_user_score || u.neynar_score || 0,
                    powerBadge: u.power_badge || u.powerBadge || false
                };
            });

            // Map following - handle both direct and nested user object
            const mappedFollowing: UserProfile[] = userFollowing.map((item: any) => {
                const u = item.user || item;
                return {
                    fid: u.fid,
                    username: u.username || 'unknown',
                    displayName: u.display_name || u.displayName || u.username || 'Unknown',
                    pfpUrl: u.pfp_url || u.pfpUrl || 'https://via.placeholder.com/150',
                    followerCount: u.follower_count || u.followerCount || 0,
                    followingCount: u.following_count || u.followingCount || 0,
                    neynarScore: u.experimental?.neynar_user_score || u.neynar_score || 0,
                    powerBadge: u.power_badge || u.powerBadge || false
                };
            });

            // Debug: Check mapped result
            if (mappedFollowers.length > 0) {
                console.log('[FollowScan] DEBUG - Mapped first follower:', mappedFollowers[0]);
            }

            console.log(`[FollowScan] ✅ Fetched ${mappedFollowers.length} followers, ${mappedFollowing.length} following`);

            if (mappedFollowers.length === 0 && mappedFollowing.length === 0) {
                setDataError('⚠️ No data received. Check console for details.');
            }

            setFollowers(mappedFollowers);
            setFollowing(mappedFollowing);
            calculateRelationships(mappedFollowers, mappedFollowing);
            setHasScanned(true);

        } catch (err) {
            console.error('[FollowScan] Scan failed:', err);
            setDataError('❌ Scan failed. Please try again.');
        } finally {
            setIsLoadingData(false);
        }
    };

    const calculateRelationships = (followersList: UserProfile[], followingList: UserProfile[]): void => {
        console.log('[FollowScan] ==========================================');
        console.log('[FollowScan] Calculating relationships...');
        console.log('[FollowScan] Followers count:', followersList.length);
        console.log('[FollowScan] Following count:', followingList.length);

        // Debug: Check first few FIDs
        if (followersList.length > 0) {
            console.log('[FollowScan] Sample follower FIDs:', followersList.slice(0, 5).map(f => f.fid));
        }
        if (followingList.length > 0) {
            console.log('[FollowScan] Sample following FIDs:', followingList.slice(0, 5).map(f => f.fid));
        }

        const followerFids = new Set(followersList.map((f) => f.fid));
        const followingFids = new Set(followingList.map((f) => f.fid));

        console.log('[FollowScan] Follower FIDs set size:', followerFids.size);
        console.log('[FollowScan] Following FIDs set size:', followingFids.size);

        // People I follow who don't follow me back
        const notFollowing = followingList.filter((f) => !followerFids.has(f.fid));
        console.log('[FollowScan] Not following back:', notFollowing.length);
        setNotFollowingBack(notFollowing);

        // Mutual follows
        const mutual = followingList.filter((f) => followerFids.has(f.fid));
        console.log('[FollowScan] Mutual follows:', mutual.length);
        setMutualFollows(mutual);

        // People who follow me but I don't follow back (FANS)
        const youDont = followersList.filter((f) => !followingFids.has(f.fid));
        console.log('[FollowScan] Fans (you dont follow):', youDont.length);

        // Debug: Why are fans 0?
        if (youDont.length === 0 && followersList.length > followingList.length) {
            console.log('[FollowScan] DEBUG: Fans should not be 0!');
            const testFollower = followersList[0];
            if (testFollower) {
                console.log('[FollowScan] Test follower FID:', testFollower.fid, 'Type:', typeof testFollower.fid);
                console.log('[FollowScan] Is in following set?', followingFids.has(testFollower.fid));
            }
        }
        setYouDontFollow(youDont);

        console.log(`[FollowScan] ✅ FINAL: ${notFollowing.length} not following back, ${mutual.length} mutual, ${youDont.length} fans`);
        console.log('[FollowScan] ==========================================');
    };

    const sortUsers = (users: UserProfile[]): UserProfile[] => {
        const sorted = [...users];

        if (sortBy === 'username') {
            sorted.sort((a, b) => a.username.localeCompare(b.username));
        } else if (sortBy === 'followers') {
            sorted.sort((a, b) => b.followerCount - a.followerCount);
        } else if (sortBy === 'fid') {
            sorted.sort((a, b) => a.fid - b.fid);
        } else if (sortBy === 'score') {
            sorted.sort((a, b) => b.neynarScore - a.neynarScore);
        }

        return sorted;
    };

    const getCurrentList = (): UserProfile[] => {
        if (activeTab === 'notFollowingBack') return notFollowingBack;
        if (activeTab === 'mutualFollows') return mutualFollows;
        return youDontFollow;
    };

    const openProfile = useCallback((username: string) => {
        window.open(`https://warpcast.com/${username}`, '_blank');
    }, []);

    const getScoreColor = (score: number): string => {
        if (score >= 0.8) return 'text-green-500 dark:text-green-400';
        if (score >= 0.5) return 'text-yellow-500 dark:text-yellow-400';
        if (score >= 0.2) return 'text-orange-500 dark:text-orange-400';
        return 'text-gray-400 dark:text-gray-500';
    };

    if (isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
                <Card className="max-w-md w-full border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <CardContent className="pt-6">
                        <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">❌ Profile Not Found</h2>
                        <p className="text-red-600 dark:text-red-300 mb-4">Could not load user profile for FID: {initialFid}</p>
                        <Button onClick={() => loadUserProfile(initialFid)} className="w-full bg-red-600 hover:bg-red-700">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const currentList = sortUsers(getCurrentList());

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Tip Modal */}
            <TipModal isOpen={showTipModal} onClose={() => setShowTipModal(false)} />

            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/icon.jpg" alt="Follow Scan" className="w-8 h-8 rounded-lg" />
                        <span className="font-bold text-lg text-purple-700 dark:text-purple-400">Follow Scan</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTipModal(true)}
                            className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/50 dark:hover:to-pink-800/50 transition-all"
                            title="Support the Developer"
                        >
                            <span className="text-lg">☕</span>
                        </button>
                        <ThemeToggle />
                    </div>
                </div>
            </header>



            <div className="container mx-auto px-4 py-6 max-w-6xl">
                {/* User Profile Card */}
                <Card className="mb-6 border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 shadow-xl">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4 mb-4">
                            <img
                                src={user.pfpUrl}
                                alt={user.username}
                                className="w-20 h-20 rounded-full border-4 border-purple-200 dark:border-purple-700 object-cover shadow-lg"
                            />
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{user.displayName}</h1>
                                <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">FID: {user.fid}</span>
                                    {user.powerBadge && (
                                        <span className="text-purple-500" title="Power Badge">⚡ Power User</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Neynar Score:</span>
                                    <span className={`text-lg font-bold ${getScoreColor(user.neynarScore)}`}>
                                        {user.neynarScore.toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => openProfile(user.username)}
                                    className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm font-medium inline-flex items-center gap-1 mt-2"
                                >
                                    View on Warpcast
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* GM Streak */}
                        <div className="mb-4">
                            <GMStreak />
                        </div>

                        {/* Scan Button */}
                        {!hasScanned && (
                            <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl p-6 mb-4 text-center border-2 border-purple-200 dark:border-purple-700">
                                <h3 className="text-xl font-bold text-purple-800 dark:text-purple-300 mb-2">🔍 Ready to Scan</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Analyze your follow relationships
                                </p>
                                <Button
                                    onClick={scanFollowData}
                                    disabled={isLoadingData}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 shadow-lg"
                                    size="lg"
                                >
                                    {isLoadingData ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Scanning...
                                        </span>
                                    ) : (
                                        '🚀 Scan Follow Data'
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* Stats after scan */}
                        {hasScanned && (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-4 text-center">
                                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{followers.length.toLocaleString()}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Followers</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 text-center">
                                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{following.length.toLocaleString()}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Following</p>
                                    </div>
                                </div>

                                <Button
                                    onClick={scanFollowData}
                                    disabled={isLoadingData}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {isLoadingData ? 'Refreshing...' : '🔄 Refresh Data'}
                                </Button>
                            </>
                        )}

                        {dataError && (
                            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                                <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">{dataError}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Big Stats Card */}
                {hasScanned && (
                    <Card className="mb-4 border-red-300 dark:border-red-800 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 shadow-xl">
                        <CardContent className="p-4">
                            <div className="text-center">
                                <div className="mb-1">
                                    <span className="text-4xl">💔</span>
                                </div>
                                <h2 className="text-3xl font-extrabold text-red-700 dark:text-red-400 mb-1">
                                    {notFollowingBack.length.toLocaleString()}
                                </h2>
                                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                                    Not Following You Back
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tabs and List */}
                {hasScanned && (
                    <>
                        {/* Tab Options */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <Button
                                onClick={() => setActiveTab('notFollowingBack')}
                                variant={activeTab === 'notFollowingBack' ? 'default' : 'outline'}
                                className={`px-1 h-auto py-2 ${activeTab === 'notFollowingBack' ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600' : ''}`}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-xs sm:text-sm">💔 Unfollowers</span>
                                    <span className="text-xs opacity-80">({notFollowingBack.length})</span>
                                </div>
                            </Button>
                            <Button
                                onClick={() => setActiveTab('mutualFollows')}
                                variant={activeTab === 'mutualFollows' ? 'default' : 'outline'}
                                className={`px-1 h-auto py-2 ${activeTab === 'mutualFollows' ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600' : ''}`}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-xs sm:text-sm">💚 Mutual</span>
                                    <span className="text-xs opacity-80">({mutualFollows.length})</span>
                                </div>
                            </Button>
                            <Button
                                onClick={() => setActiveTab('youDontFollow')}
                                variant={activeTab === 'youDontFollow' ? 'default' : 'outline'}
                                className={`px-1 h-auto py-2 ${activeTab === 'youDontFollow' ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600' : ''}`}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-xs sm:text-sm">👥 Fans</span>
                                    <span className="text-xs opacity-80">({youDontFollow.length})</span>
                                </div>
                            </Button>
                        </div>

                        {/* Sort Options */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="text-sm text-gray-500 dark:text-gray-400 self-center">Sort by:</span>
                            <Button
                                onClick={() => setSortBy('score')}
                                variant={sortBy === 'score' ? 'default' : 'outline'}
                                size="sm"
                            >
                                ⭐ Score
                            </Button>
                            <Button
                                onClick={() => setSortBy('followers')}
                                variant={sortBy === 'followers' ? 'default' : 'outline'}
                                size="sm"
                            >
                                👥 Followers
                            </Button>
                            <Button
                                onClick={() => setSortBy('username')}
                                variant={sortBy === 'username' ? 'default' : 'outline'}
                                size="sm"
                            >
                                A-Z
                            </Button>
                            <Button
                                onClick={() => setSortBy('fid')}
                                variant={sortBy === 'fid' ? 'default' : 'outline'}
                                size="sm"
                            >
                                FID
                            </Button>
                        </div>

                        {/* User List */}
                        {currentList.length === 0 ? (
                            <Card className="border-gray-200 dark:border-gray-700">
                                <CardContent className="pt-6 text-center text-gray-500 dark:text-gray-400">
                                    No users in this category.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {currentList.map((profile) => (
                                    <Card key={profile.fid} className="hover:shadow-xl transition-all duration-300 border-purple-100 dark:border-gray-700 bg-white dark:bg-gray-800 group">
                                        <CardContent className="pt-5 pb-4">
                                            <div className="flex items-start gap-3">
                                                <img
                                                    src={profile.pfpUrl}
                                                    alt={profile.username}
                                                    className="w-12 h-12 rounded-full border-2 border-purple-200 dark:border-purple-700 object-cover"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800 dark:text-white truncate">{profile.displayName}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</span>
                                                        {profile.powerBadge && (
                                                            <span className="text-purple-500" title="Power Badge">⚡</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{profile.followerCount.toLocaleString()} followers</p>

                                                    {/* Neynar Score */}
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">Neynar Score:</span>
                                                        <span className={`text-sm font-semibold ${getScoreColor(profile.neynarScore)}`}>
                                                            {profile.neynarScore.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Visit Profile Button */}
                                                <button
                                                    onClick={() => openProfile(profile.username)}
                                                    className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors opacity-70 group-hover:opacity-100"
                                                    title="Visit Profile"
                                                >
                                                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-700 py-6 mt-8">
                <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>Built with 💜 for Farcaster</p>
                </div>
            </footer>
        </div>
    );
}
