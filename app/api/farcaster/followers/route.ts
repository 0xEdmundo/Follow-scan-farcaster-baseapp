import { NextRequest, NextResponse } from 'next/server';
import { NEYNAR_API_KEY, NEYNAR_BASE_URL } from '@/lib/neynar-config';

export async function GET(request: NextRequest): Promise<NextResponse> {
    const searchParams = request.nextUrl.searchParams;
    const fidParam = searchParams.get('fid');

    if (!fidParam) {
        return NextResponse.json({ error: 'FID is required' }, { status: 400 });
    }

    const fid = parseInt(fidParam, 10);

    if (isNaN(fid)) {
        return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
    }

    console.log(`[Followers API] Fetching ALL followers for FID: ${fid}`);

    try {
        const allFollowers: any[] = [];
        let cursor: string | null = null;
        let pageCount = 0;

        // NO LIMIT - fetch all pages until API returns no more data
        while (true) {
            pageCount++;

            let url = `${NEYNAR_BASE_URL}/v2/farcaster/followers?fid=${fid}&limit=100`;
            if (cursor) {
                url += `&cursor=${cursor}`;
            }

            console.log(`[Followers API] Page ${pageCount}: fetching...`);

            const response = await fetch(url, {
                headers: {
                    'x-api-key': NEYNAR_API_KEY,
                    'accept': 'application/json',
                },
                next: { revalidate: 60 }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Followers API] Error: ${response.status} - ${errorText}`);

                // Return what we have so far if error occurs mid-fetch
                if (allFollowers.length > 0) {
                    console.log(`[Followers API] Returning ${allFollowers.length} followers collected before error`);
                    break;
                }

                return NextResponse.json(
                    {
                        error: `Neynar API error: ${response.status}`,
                        details: errorText,
                        followers: []
                    },
                    { status: response.status }
                );
            }

            const data = await response.json();

            // Debug: Log actual response structure
            if (pageCount === 1) {
                console.log('[Followers API] Response keys:', Object.keys(data));
                if (data.users && data.users.length > 0) {
                    console.log('[Followers API] First user keys:', Object.keys(data.users[0]));
                    console.log('[Followers API] First user sample:', JSON.stringify(data.users[0]).substring(0, 500));
                }
            }

            const users = data.users || [];

            if (users.length > 0) {
                // Neynar followers endpoint returns { user: {...} } objects
                const mappedUsers = users.map((item: any) => {
                    // The response might be nested: { user: { fid, username, ... } }
                    const user = item.user || item;
                    return {
                        fid: user.fid,
                        username: user.username,
                        display_name: user.display_name || user.username,
                        pfp_url: user.pfp_url || 'https://via.placeholder.com/150',
                        follower_count: user.follower_count || 0,
                        following_count: user.following_count || 0,
                        neynar_score: user.experimental?.neynar_user_score || 0,
                        power_badge: user.power_badge || false
                    };
                });

                allFollowers.push(...mappedUsers);

                // Log progress every 10 pages
                if (pageCount % 10 === 0) {
                    console.log(`[Followers API] Progress: ${allFollowers.length} followers collected...`);
                }
            }

            // Check for next page
            cursor = data.next?.cursor || null;
            if (!cursor) {
                console.log(`[Followers API] ✅ Completed! Total: ${allFollowers.length} followers`);
                break;
            }
        }

        console.log(`[Followers API] ✅ Final total: ${allFollowers.length} followers in ${pageCount} pages`);

        return NextResponse.json({
            followers: allFollowers,
            total: allFollowers.length,
            source: 'neynar'
        });

    } catch (error) {
        console.error('[Followers API] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch followers',
                details: error instanceof Error ? error.message : 'Unknown error',
                followers: []
            },
            { status: 500 }
        );
    }
}
