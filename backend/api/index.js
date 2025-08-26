// Simplified API for Vercel (no Socket.IO, no persistent state)
const { v4: uuidv4 } = require("uuid");

const tokens = ["ETH", "BNB", "AVAX", "USDT", "USDC", "ANOMA"];
const networks = [
  "Anoma", "Ethereum", "Cosmos", "Arbitrum", "Optimism", "BNB", "Solana", "AVAX"
];

let stakingPools = [
  { id: uuidv4(), provider: "AnomaChain", token: "USDC", network: "Anoma", apr: 15.5, lockPeriod: 7, available: 10000 },
  { id: uuidv4(), provider: "AnomaChain Plus", token: "USDC", network: "Anoma", apr: 18.2, lockPeriod: 14, available: 8000 },
  { id: uuidv4(), provider: "Osmosis", token: "USDC", network: "Cosmos", apr: 12.2, lockPeriod: 7, available: 8000 },
  { id: uuidv4(), provider: "Lido", token: "ETH", network: "Ethereum", apr: 5.8, lockPeriod: 30, available: 500 },
  { id: uuidv4(), provider: "SolanaStake", token: "USDT", network: "Solana", apr: 9.7, lockPeriod: 10, available: 2000 },
  { id: uuidv4(), provider: "PancakeSwap", token: "BNB", network: "BNB", apr: 8.3, lockPeriod: 21, available: 1500 },
  { id: uuidv4(), provider: "AvalancheStake", token: "AVAX", network: "AVAX", apr: 11.2, lockPeriod: 14, available: 1200 }
];

let swapRates = {
  "USDC-ANOMA": 2,
  "ANOMA-USDC": 0.5,
  "ETH-USDC": 3500,
  "USDC-ETH": 0.0002857,
  "BNB-AVAX": 1.2,
  "AVAX-BNB": 0.83,
  "USDT-USDC": 1.0,
  "USDC-USDT": 1.0,
  "ETH-ANOMA": 7000,
  "ANOMA-ETH": 0.0001429,
  "BNB-USDC": 600.0,
  "USDC-BNB": 0.00167,
  "AVAX-USDC": 40.0,
  "USDC-AVAX": 0.025,
  "ETH-BNB": 5.83,
  "BNB-ETH": 0.171,
  "AVAX-ETH": 0.0114,
  "ETH-AVAX": 87.5,
  "BNB-ANOMA": 1200.0,
  "ANOMA-BNB": 0.00083,
  "AVAX-ANOMA": 80.0,
  "ANOMA-AVAX": 0.0125,
  "USDT-BNB": 0.00167,
  "BNB-USDT": 600.0,
  "USDT-AVAX": 0.025,
  "AVAX-USDT": 40.0,
  "USDT-ETH": 0.0002857,
  "ETH-USDT": 3500.0,
  "USDT-ANOMA": 2.0,
  "ANOMA-USDT": 0.5
};

// Mock data for demonstration
let mockIntents = [
  {
    id: uuidv4(),
    type: "swap",
    fromToken: "ETH",
    toToken: "USDC",
    amount: 1.5,
    rate: 3500,
    status: "pending",
    createdAt: Date.now() - 30000,
    nickname: "crypto_trader",
    avatar: "shrimp1"
  },
  {
    id: uuidv4(),
    type: "swap", 
    fromToken: "USDC",
    toToken: "ANOMA",
    amount: 1000,
    rate: 2,
    status: "completed",
    createdAt: Date.now() - 60000,
    nickname: "anoma_fan",
    avatar: "shrimp2"
  }
];

let mockStakingHistory = [
  {
    id: uuidv4(),
    nickname: "stake_master",
    avatar: "shrimp3",
    originalToken: "USDC",
    originalAmount: 5000,
    finalToken: "USDC", 
    finalAmount: 5000,
    poolProvider: "AnomaChain",
    poolNetwork: "Anoma",
    apr: 15.5,
    lockPeriod: 7,
    completedAt: Date.now() - 120000,
    status: "completed"
  }
];

let mockLeaderboard = [
  { nickname: "crypto_master", avatar: "shrimp1", score: 15 },
  { nickname: "anoma_trader", avatar: "shrimp2", score: 12 },
  { nickname: "defi_king", avatar: "shrimp3", score: 8 }
];

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  
  try {
    // Route handling
    if (url === '/' || url === '/api') {
      res.status(200).json({ 
        message: 'Anoma Intent Simulation API',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/api/health',
          intents: '/api/intents', 
          stakingIntents: '/api/staking-intents',
          stakingHistory: '/api/staking-history',
          stakingPools: '/api/staking-pools',
          leaderboard: '/api/leaderboard',
          swapRates: '/api/swap-rates'
        }
      });
      
    } else if (url === '/api/health') {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        activeUsers: 5,
        totalIntents: mockIntents.length,
        pendingIntents: mockIntents.filter(i => i.status === "pending").length,
        completedIntents: mockIntents.filter(i => i.status === "completed").length,
        stakingPools: stakingPools.length,
        availablePools: stakingPools.filter(p => p.available > 0).length,
        swapRates: Object.keys(swapRates).length
      });
      
    } else if (url === '/api/intents') {
      const visibleIntents = mockIntents.filter(i => i.type === "swap");
      res.status(200).json(visibleIntents);
      
    } else if (url === '/api/staking-intents') {
      const stakingIntents = mockIntents.filter(i => i.type === "staking");
      res.status(200).json(stakingIntents);
      
    } else if (url === '/api/staking-history') {
      res.status(200).json(mockStakingHistory.sort((a, b) => b.completedAt - a.completedAt));
      
    } else if (url === '/api/staking-pools') {
      res.status(200).json(stakingPools);
      
    } else if (url === '/api/leaderboard') {
      res.status(200).json(mockLeaderboard.sort((a, b) => b.score - a.score));
      
    } else if (url === '/api/swap-rates') {
      res.status(200).json(swapRates);
      
    } else {
      res.status(404).json({ 
        error: 'Not Found',
        message: 'Endpoint tidak ditemukan',
        availableEndpoints: [
          '/api/health',
          '/api/intents', 
          '/api/staking-history',
          '/api/staking-pools',
          '/api/leaderboard',
          '/api/swap-rates'
        ]
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
};
