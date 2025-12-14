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

    console.log(`[Following API] Fetching ALL following for FID: ${fid}`);

    try {
        const allFollowing: any[] = [];
        let cursor: string | null = null;
        let pageCount = 0;

        while (true) {
            pageCount++;

            let url = `${NEYNAR_BASE_URL}/v2/farcaster/following?fid=${fid}&limit=100`;
            if (cursor) {
                url += `&cursor=${cursor}`;
            }

            console.log(`[Following API] Page ${pageCount}: fetching...`);

            const response = await fetch(url, {
                headers: {
                    'x-api-key': NEYNAR_API_KEY,
                    'accept': 'application/json',
                },
                next: { revalidate: 60 }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Following API] Error: ${response.status} - ${errorText}`);

                if (allFollowing.length > 0) {
                    console.log(`[Following API] Returning ${allFollowing.length} following collected before error`);
                    break;
                }

                return NextResponse.json(
                    {
                        error: `Neynar API error: ${response.status}`,
                        details: errorText,
                        following: []
                    },
                    { status: response.status }
                );
            }

            const data = await response.json();

            // Debug: Log actual response structure
            if (pageCount === 1) {
                console.log('[Following API] Response keys:', Object.keys(data));
                if (data.users && data.users.length > 0) {
                    console.log('[Following API] First user keys:', Object.keys(data.users[0]));
                    console.log('[Following API] First user sample:', JSON.stringify(data.users[0]).substring(0, 500));
                }
            }

            const users = data.users || [];

            if (users.length > 0) {
                // Neynar following endpoint returns { user: {...} } objects
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

                allFollowing.push(...mappedUsers);

                if (pageCount % 10 === 0) {
                    console.log(`[Following API] Progress: ${allFollowing.length} following collected...`);
                }
            }

            cursor = data.next?.cursor || null;
            if (!cursor) {
                console.log(`[Following API] ✅ Completed! Total: ${allFollowing.length} following`);
                break;
            }
        }

        console.log(`[Following API] ✅ Final total: ${allFollowing.length} following in ${pageCount} pages`);

        return NextResponse.json({
            following: allFollowing,
            total: allFollowing.length,
            source: 'neynar'
        });

    } catch (error) {
        console.error('[Following API] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch following',
                details: error instanceof Error ? error.message : 'Unknown error',
                following: []
            },
            { status: 500 }
        );
    }
}
