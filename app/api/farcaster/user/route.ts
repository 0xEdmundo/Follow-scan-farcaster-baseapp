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

    console.log(`[User API] Fetching user profile for FID: ${fid}`);

    try {
        const url = `${NEYNAR_BASE_URL}/v2/farcaster/user/bulk?fids=${fid}`;

        const response = await fetch(url, {
            headers: {
                'x-api-key': NEYNAR_API_KEY,
                'accept': 'application/json',
            },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[User API] Error: ${response.status} - ${errorText}`);
            return NextResponse.json(
                { error: `Failed to fetch user: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        if (!data.users || data.users.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const user = data.users[0];

        return NextResponse.json({
            user: {
                fid: user.fid,
                username: user.username,
                displayName: user.display_name || user.username,
                pfpUrl: user.pfp_url || 'https://via.placeholder.com/150',
                followerCount: user.follower_count || 0,
                followingCount: user.following_count || 0,
                bio: user.profile?.bio?.text || '',
                neynarScore: user.experimental?.neynar_user_score || 0,
                powerBadge: user.power_badge || false
            }
        });

    } catch (error) {
        console.error('[User API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user profile' },
            { status: 500 }
        );
    }
}
