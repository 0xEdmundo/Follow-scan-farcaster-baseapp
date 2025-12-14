'use client';

import { useEffect, useState, useCallback } from 'react';
import sdk from '@farcaster/frame-sdk';

interface FarcasterContext {
    fid: number | null;
    username: string | null;
    isLoaded: boolean;
    isInFrame: boolean;
}

export function useFarcasterContext(): FarcasterContext {
    const [context, setContext] = useState<FarcasterContext>({
        fid: null,
        username: null,
        isLoaded: false,
        isInFrame: false
    });

    useEffect(() => {
        const initContext = async () => {
            try {
                const frameContext = await sdk.context;

                if (frameContext?.user) {
                    setContext({
                        fid: frameContext.user.fid,
                        username: frameContext.user.username || null,
                        isLoaded: true,
                        isInFrame: true
                    });
                } else {
                    // Check URL params as fallback
                    const urlParams = new URLSearchParams(window.location.search);
                    const fidParam = urlParams.get('fid');

                    setContext({
                        fid: fidParam ? parseInt(fidParam, 10) : null,
                        username: null,
                        isLoaded: true,
                        isInFrame: false
                    });
                }
            } catch (error) {
                console.error('Failed to get Farcaster context:', error);

                // Fallback to URL params
                const urlParams = new URLSearchParams(window.location.search);
                const fidParam = urlParams.get('fid');

                setContext({
                    fid: fidParam ? parseInt(fidParam, 10) : null,
                    username: null,
                    isLoaded: true,
                    isInFrame: false
                });
            }
        };

        initContext();
    }, []);

    return context;
}

export function useAddFrame() {
    const [isAdded, setIsAdded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const addFrame = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await sdk.actions.addFrame();
            if (result.added) {
                setIsAdded(true);
                console.log('Frame added successfully, notification token:', result.notificationDetails?.token);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to add frame:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { addFrame, isAdded, isLoading };
}

export function useFarcasterReady() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const setReady = async () => {
            try {
                await sdk.actions.ready();
                setIsReady(true);
            } catch (error) {
                console.error('Failed to set ready:', error);
                // Still set ready for non-frame contexts
                setIsReady(true);
            }
        };

        setReady();
    }, []);

    return isReady;
}
