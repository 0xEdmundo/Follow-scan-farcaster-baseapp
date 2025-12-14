'use client'

import { FollowScan } from '@/components/FollowScan';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

function FollowScanContent() {
  const searchParams = useSearchParams();
  const fidParam = searchParams.get('fid');
  const [contextFid, setContextFid] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Call sdk.actions.ready() immediately on mount
  useEffect(() => {
    const initFrame = async () => {
      try {
        // Dynamically import SDK to avoid SSR issues
        const sdk = (await import('@farcaster/frame-sdk')).default;

        // Call ready first to dismiss splash screen
        await sdk.actions.ready();

        // Get FID from Farcaster context
        const context = await sdk.context;
        if (context?.user?.fid) {
          setContextFid(context.user.fid);
        }
      } catch (error) {
        console.log('Not in Farcaster frame context');
      } finally {
        setIsReady(true);
      }
    };

    initFrame();
  }, []);

  // Use context FID if available, otherwise use URL param
  const fid = contextFid || (fidParam ? parseInt(fidParam, 10) : null);

  // Show loading while waiting for frame context
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <img src="/splash.png" alt="Loading" className="w-20 h-20 mx-auto animate-pulse mb-4" />
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!fid || isNaN(fid)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="text-center max-w-lg">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-purple-100 dark:border-gray-700">
            {/* Logo */}
            <div className="mb-6">
              <img
                src="/splash.png"
                alt="Follow Scan"
                className="w-24 h-24 mx-auto animate-pulse"
              />
            </div>

            <h1 className="text-3xl font-bold gradient-text mb-4">Follow Scan</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Analyze your Farcaster follow relationships. Find who doesn&apos;t follow you back.
            </p>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-2">
                Add your FID to the URL:
              </p>
              <code className="block bg-purple-100 dark:bg-purple-900/40 px-4 py-2 rounded-lg text-purple-800 dark:text-purple-200 text-sm font-mono">
                ?fid=YOUR_FID
              </code>
            </div>

            <div className="space-y-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Quick test:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <a href="?fid=3">
                  <Button variant="outline" size="sm">
                    @dwr.eth
                  </Button>
                </a>
                <a href="?fid=2">
                  <Button variant="outline" size="sm">
                    @v
                  </Button>
                </a>
                <a href="?fid=194">
                  <Button variant="outline" size="sm">
                    @jessepollak
                  </Button>
                </a>
              </div>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="p-3">
                <div className="text-2xl mb-1">💔</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Unfollowers</p>
              </div>
              <div className="p-3">
                <div className="text-2xl mb-1">💚</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Mutual</p>
              </div>
              <div className="p-3">
                <div className="text-2xl mb-1">⭐</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Score</p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Built with 💜 for Farcaster
          </p>
        </div>
      </div>
    );
  }

  return <FollowScan initialFid={fid} />;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <img
          src="/splash.png"
          alt="Loading"
          className="w-20 h-20 mx-auto animate-pulse mb-4"
        />
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <FollowScanContent />
    </Suspense>
  );
}
