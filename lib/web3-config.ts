// Web3 Configuration for Follow Scan
// Base Mainnet with Coinbase Paymaster

export const CHAIN_ID = 8453; // Base Mainnet

// Coinbase Paymaster API for sponsored transactions
export const PAYMASTER_URL = 'https://api.developer.coinbase.com/rpc/v1/base/mEsgaNXGDFXMrxhpviPmHSBCmWMeG8KX';

export const CONTRACTS = {
    // Tip contract - receives donations
    TIP_ADDRESS: '0xFb7C003C4F1E98AA449A771F59acf9d876EA9e2c' as `0x${string}`,

    // GM Streak contract - daily check-in
    GM_STREAK_ADDRESS: '0x7a9B0e433B34306b7e84C6CbCb961462b144Bb6b' as `0x${string}`,

    // USDC on Base Mainnet
    USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
};

// GM Streak Contract ABI (using correct functions from verified contract)
export const GM_STREAK_ABI = [
    {
        name: 'sayGM',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: [],
    },
    {
        name: 'getUserStats',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_user', type: 'address' }],
        outputs: [
            { name: 'lastGM', type: 'uint256' },
            { name: 'streak', type: 'uint256' },
            { name: 'total', type: 'uint256' },
        ],
    },
    {
        name: 'isStreakActive',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '_user', type: 'address' }],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'COOLDOWN_TIME',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'RESET_TIME',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;

// ERC20 ABI for USDC transfers
export const ERC20_ABI = [
    {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
    },
] as const;

// Base chain configuration
export const baseChain = {
    id: 8453,
    name: 'Base',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://mainnet.base.org'],
        },
        public: {
            http: ['https://mainnet.base.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'BaseScan',
            url: 'https://basescan.org',
        },
    },
} as const;
