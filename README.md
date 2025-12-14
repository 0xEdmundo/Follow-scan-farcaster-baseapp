# Follow Scan

Analyze your Farcaster follow relationships. Find who doesn't follow you back, discover mutual follows, and see Neynar scores for better insights.

![Follow Scan Preview](/public/og-image.jpg)

## 🚀 Features

- **Not Following Back**: See users you follow who don't follow you back 💔
- **Mutual Follows**: View your mutual connections 💚
- **Fans**: Discover people who follow you but you don't follow back 👥
- **Neynar Score**: See quality scores for each user ⭐
- **Visit Profile**: Quick link to view profiles on Warpcast
- **Dark/Light Mode**: Toggle between themes 🌓
- **Farcaster Mini App**: Add to your Farcaster for notifications
- **Sorting**: Sort by score, followers, username, or FID

## 📦 Installation

```bash
npm install
```

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
NEYNAR_API_KEY=your_neynar_api_key_here
```

> **Note**: The app includes a default API key for testing. For production, use your own Neynar API key from [neynar.com](https://neynar.com).

## 🏃 Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

Add your Farcaster FID to the URL:
```
http://localhost:3000?fid=YOUR_FID
```

Example:
```
http://localhost:3000?fid=3
```

## 🏗️ Build

```bash
npm run build
```

## 📁 Project Structure

```
follow-scan/
├── app/
│   ├── api/
│   │   └── farcaster/
│   │       ├── followers/route.ts   # Followers API with Neynar Score
│   │       ├── following/route.ts   # Following API with Neynar Score
│   │       └── user/route.ts        # User profile API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── FollowScan.tsx       # Main component
│   ├── Providers.tsx        # Theme provider
│   ├── ThemeToggle.tsx      # Dark/Light mode toggle
│   └── ui/
│       ├── button.tsx
│       └── card.tsx
├── lib/
│   ├── farcaster-hooks.ts   # Farcaster SDK hooks
│   └── neynar-config.ts     # API configuration
├── public/
│   ├── og-image.jpg         # Open Graph preview image
│   ├── icon.jpg             # App icon
│   ├── splash.png           # Splash screen image
│   └── .well-known/
│       └── farcaster.json   # Farcaster frame manifest
└── package.json
```

## 🔧 Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Theme**: next-themes (Dark/Light mode)
- **API**: Neynar (Farcaster data)
- **SDK**: @farcaster/frame-sdk

## 🎨 Brand Assets

- **OG Image**: `public/og-image.jpg` - Preview image for embeds
- **Icon**: `public/icon.jpg` - App icon (no text)
- **Splash**: `public/splash.png` - Animated splash screen

## 🚀 Deploy to Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add environment variable: `NEYNAR_API_KEY`
4. Deploy!

### Farcaster Mini App Setup

After deploying, update the URLs in:
- `public/.well-known/farcaster.json`
- `app/layout.tsx` (fc:frame metadata)

## 📄 License

MIT
