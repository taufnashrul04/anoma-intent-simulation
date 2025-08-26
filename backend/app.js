// --- BACKEND SCRIPT: FULL VERSION ---
// Features:
// - Persistent user
// - Swap rates, decimal amount
// - Solver fallback for unmatched swap
// - Staking: constraint support, multi-protocol split
// - Leaderboard update for swap & staking
// - API endpoints for intents, pools, health, etc.

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const tokens = ["ETH", "BNB", "AVAX", "USDT", "USDC", "ANOMA"];
const networks = [
  "Anoma", "Ethereum", "Cosmos", "Arbitrum", "Optimism", "BNB", "Solana", "AVAX"
];
const privacies = ["tinggi", "sedang", "rendah"];

const INITIAL_BALANCES = {
  "ETH": 1.0,
  "BNB": 5.0,
  "AVAX": 10.0,
  "USDT": 1000,
  "USDC": 1000,
  "ANOMA": 500
};

let stakingPools = [
  { id: uuidv4(), provider: "AnomaChain", token: "USDC", network: "Anoma", apr: 15.5, lockPeriod: 7, available: 10000 },
  { id: uuidv4(), provider: "AnomaChain Plus", token: "USDC", network: "Anoma", apr: 18.2, lockPeriod: 14, available: 8000 },
  { id: uuidv4(), provider: "Osmosis", token: "USDC", network: "Cosmos", apr: 12.2, lockPeriod: 7, available: 8000 },
  { id: uuidv4(), provider: "Lido", token: "ETH", network: "Ethereum", apr: 5.8, lockPeriod: 30, available: 500 },
  { id: uuidv4(), provider: "SolanaStake", token: "USDT", network: "Solana", apr: 9.7, lockPeriod: 10, available: 2000 },
  { id: uuidv4(), provider: "PancakeSwap", token: "BNB", network: "BNB", apr: 8.3, lockPeriod: 21, available: 1500 },
  { id: uuidv4(), provider: "AvalancheStake", token: "AVAX", network: "AVAX", apr: 11.2, lockPeriod: 14, available: 1200 }
];

let persistentUsers = {}; // nickname -> data
let users = {};
let intentPool = [];
let stakingHistory = [];
let transactionHistory = {};
let userStakes = {};
let leaderboard = [];

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

const botUsers = [
  { id: "bot1", nickname: "stake_anoma", avatar: "shrimp2" },
  { id: "bot2", nickname: "swap_anoma", avatar: "shrimp3" },
  { id: "bot3", nickname: "magic_anoma", avatar: "shrimp1" },
];

// Solver bot for swap fallback
let solvers = [
  {
    id: "solver1",
    nickname: "anoma_solver",
    avatar: "shrimp_solver",
    inventory: {
      ETH: 10,
      BNB: 100,
      AVAX: 100,
      USDT: 5000,
      USDC: 5000,
      ANOMA: 2000
    },
    networks: ["Ethereum", "BNB", "AVAX", "Anoma", "Optimism", "Arbitrum", "Cosmos", "Solana"]
  }
];

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function checkBalance(userId, token, amount) {
  const user = users[userId];
  if (!user || !user.balances) return false;
  return (user.balances[token] || 0) >= amount;
}
function deductBalance(userId, token, amount) {
  const user = users[userId];
  if (!user || !user.balances) return false;
  if ((user.balances[token] || 0) >= amount) {
    user.balances[token] -= amount;
    if (persistentUsers[user.nickname]) persistentUsers[user.nickname].balances = { ...user.balances };
    return true;
  }
  return false;
}
function addBalance(userId, token, amount) {
  const user = users[userId];
  if (!user || !user.balances) return false;
  user.balances[token] = (user.balances[token] || 0) + amount;
  if (persistentUsers[user.nickname]) persistentUsers[user.nickname].balances = { ...user.balances };
  return true;
}
function recordTransaction(userId, type, data) {
  if (!transactionHistory[userId]) transactionHistory[userId] = [];
  const transaction = { id: uuidv4(), type, timestamp: Date.now(), ...data };
  transactionHistory[userId].push(transaction);
  const user = users[userId];
  if (user && persistentUsers[user.nickname]) persistentUsers[user.nickname].transactionHistory = [...transactionHistory[userId]];
  return transaction;
}

// --- MATCHING SWAP INTENT (user <-> user, then solver fallback) ---
function matchSwapIntent(newIntent) {
  if (newIntent.type !== "swap") return;
  let matched = false;
  for (let i = 0; i < intentPool.length; i++) {
    let other = intentPool[i];
    if (
      other.id !== newIntent.id &&
      other.type === "swap" &&
      other.status !== "completed" &&
      other.fromToken === newIntent.toToken &&
      other.toToken === newIntent.fromToken &&
      other.fromNetwork === newIntent.toNetwork &&
      other.toNetwork === newIntent.fromNetwork &&
      Math.abs(other.amount * other.rate - newIntent.amount) < 0.01 &&
      Math.abs(newIntent.amount * newIntent.rate - other.amount) < 0.01 &&
      other.privacy === newIntent.privacy
    ) {
      matched = true;
      const newIsReal = !newIntent.userId.startsWith("bot");
      const otherIsReal = !other.userId.startsWith("bot");
      if (newIsReal) {
        deductBalance(newIntent.userId, newIntent.fromToken, newIntent.amount);
        addBalance(newIntent.userId, newIntent.toToken, newIntent.amount * newIntent.rate);
        recordTransaction(newIntent.userId, 'swap', { fromToken: newIntent.fromToken, toToken: newIntent.toToken, amount: newIntent.amount, rate: newIntent.rate, received: newIntent.amount * newIntent.rate });
        io.to(newIntent.userId).emit("user_updated", users[newIntent.userId]);
        io.to(newIntent.userId).emit("intent_matched", newIntent);
      }
      if (otherIsReal) {
        deductBalance(other.userId, other.fromToken, other.amount);
        addBalance(other.userId, other.toToken, other.amount * other.rate);
        recordTransaction(other.userId, 'swap', { fromToken: other.fromToken, toToken: other.toToken, amount: other.amount, rate: other.rate, received: other.amount * other.rate });
        io.to(other.userId).emit("user_updated", users[other.userId]);
        io.to(other.userId).emit("intent_matched", other);
      }
      // === Leaderboard update ===
      [newIntent, other].forEach((intent) => {
        let user = leaderboard.find((u) => u.nickname === intent.nickname);
        if (user) user.score += 1;
        else leaderboard.push({ nickname: intent.nickname, avatar: intent.avatar, score: 1 });
      });
      const newIndex = intentPool.findIndex(intent => intent.id === newIntent.id);
      const otherIndex = intentPool.findIndex(intent => intent.id === other.id);
      if (newIndex !== -1) { intentPool[newIndex].status = "completed"; intentPool[newIndex].matchedWith = other.nickname; intentPool[newIndex].completedAt = Date.now(); }
      if (otherIndex !== -1) { intentPool[otherIndex].status = "completed"; intentPool[otherIndex].matchedWith = newIntent.nickname; intentPool[otherIndex].completedAt = Date.now(); }
      io.emit("intents_update", intentPool);
      io.emit("leaderboard_update", leaderboard.sort((a, b) => b.score - a.score));
      break;
    }
  }
  // --- Solver fallback (fix: user dapat poin juga!) ---
  if (!matched) {
    for (const solver of solvers) {
      if (
        solver.inventory[newIntent.toToken] &&
        solver.inventory[newIntent.toToken] >= newIntent.amount * newIntent.rate
      ) {
        solver.inventory[newIntent.toToken] -= newIntent.amount * newIntent.rate;
        solver.inventory[newIntent.fromToken] =
          (solver.inventory[newIntent.fromToken] || 0) + newIntent.amount;

        // === Leaderboard: BOTH user dan solver dapat poin ===
        let userIntentUser = leaderboard.find((u) => u.nickname === newIntent.nickname);
        if (userIntentUser) userIntentUser.score += 1;
        else leaderboard.push({ nickname: newIntent.nickname, avatar: newIntent.avatar, score: 1 });

        let solverUser = leaderboard.find((u) => u.nickname === solver.nickname);
        if (solverUser) solverUser.score += 1;
        else leaderboard.push({ nickname: solver.nickname, avatar: solver.avatar, score: 1 });

        const newIndex = intentPool.findIndex((intent) => intent.id === newIntent.id);
        if (newIndex !== -1) {
          intentPool[newIndex].status = "completed";
          intentPool[newIndex].matchedWith = solver.nickname;
          intentPool[newIndex].completedAt = Date.now();
        }
        if (!newIntent.userId.startsWith("bot")) {
          deductBalance(newIntent.userId, newIntent.fromToken, newIntent.amount);
          addBalance(newIntent.userId, newIntent.toToken, newIntent.amount * newIntent.rate);
          recordTransaction(newIntent.userId, 'swap', {
            fromToken: newIntent.fromToken,
            toToken: newIntent.toToken,
            amount: newIntent.amount,
            rate: newIntent.rate,
            received: newIntent.amount * newIntent.rate,
            fulfilledBy: "solver"
          });
          io.to(newIntent.userId).emit("user_updated", users[newIntent.userId]);
          io.to(newIntent.userId).emit("intent_matched", newIntent);
        }
        io.emit("intents_update", intentPool);
        io.emit("leaderboard_update", leaderboard.sort((a, b) => b.score - a.score));
        break;
      }
    }
  }
}

// --- MATCHING STAKING INTENT (constraint, split, leaderboard) ---
function matchStakingIntent(stakingIntent) {
  if (stakingIntent.type !== "staking") return;
  const isRealUser = !stakingIntent.userId.startsWith("bot");
  if (isRealUser && !checkBalance(stakingIntent.userId, stakingIntent.token, stakingIntent.amount)) return;

  // --- Filter pools with user constraints ---
  let pools = stakingPools.filter(pool =>
    (!stakingIntent.prefer_lock || pool.lockPeriod > 0) &&
    (!stakingIntent.prefer_flexible || pool.lockPeriod === 0) &&
    (stakingIntent.min_apy === undefined || pool.apr >= stakingIntent.min_apy) &&
    (stakingIntent.risk_constraint === "bluechip" ? pool.provider.match(/Anoma|Lido|Rocket|Osmosis|Pancake|Avalanche|Solana|BNB/) : true) &&
    (stakingIntent.liquidity_constraint === "liquid" ? pool.provider.match(/Lido|Anoma|Rocket/) : true) &&
    (stakingIntent.liquidity_constraint === "unstake48" ? pool.lockPeriod <= 2 : true)
  );

  if (stakingIntent.prefer_apr === "high") pools.sort((a, b) => b.apr - a.apr);
  else if (stakingIntent.prefer_apr === "low") pools.sort((a, b) => a.apr - b.apr);

  // --- Multi-protocol split if needed (risk_constraint: max20) ---
  let remaining = stakingIntent.amount;
  let splits = [];
  let maxPerPool = stakingIntent.risk_constraint === "max20" ? Math.max(1, stakingIntent.amount * 0.2) : stakingIntent.amount;
  for (let pool of pools) {
    if (remaining <= 0) break;
    let take = Math.min(pool.available, remaining, maxPerPool);
    if (take <= 0) continue;
    splits.push({ pool, amount: take });
    remaining -= take;
  }
  if (remaining > 0) return; // Can't fulfill intent

  // --- Save stake, update balance, transaction, leaderboard ---
  if (isRealUser) {
    if (!deductBalance(stakingIntent.userId, stakingIntent.token, stakingIntent.amount)) return;
    if (!userStakes[stakingIntent.userId]) userStakes[stakingIntent.userId] = [];
    splits.forEach(split => {
      split.pool.available -= split.amount;
      userStakes[stakingIntent.userId].push({
        id: uuidv4(),
        originalToken: stakingIntent.token,
        originalAmount: split.amount,
        token: split.pool.token,
        amount: split.amount,
        pool: split.pool.provider,
        network: split.pool.network,
        apr: split.pool.apr,
        lockPeriod: split.pool.lockPeriod,
        startDate: Date.now(),
        status: "active",
        autoSwapped: false,
        constraint: {
          risk: stakingIntent.risk_constraint,
          liquidity: stakingIntent.liquidity_constraint,
          note: stakingIntent.note
        }
      });
      recordTransaction(stakingIntent.userId, 'staking', {
        originalToken: stakingIntent.token,
        originalAmount: split.amount,
        token: split.pool.token,
        amount: split.amount,
        pool: split.pool.provider,
        apr: split.pool.apr,
        lockPeriod: split.pool.lockPeriod,
        constraint: { risk: stakingIntent.risk_constraint, liquidity: stakingIntent.liquidity_constraint, note: stakingIntent.note }
      });
    });
    io.to(stakingIntent.userId).emit("user_updated", users[stakingIntent.userId]);
    io.to(stakingIntent.userId).emit("staking_matched", { intent: stakingIntent, splits });
  }
  const intentIndex = intentPool.findIndex(intent => intent.id === stakingIntent.id);
  if (intentIndex !== -1) {
    intentPool[intentIndex].status = "completed";
    intentPool[intentIndex].splits = splits;
    intentPool[intentIndex].completedAt = Date.now();
  }
  splits.forEach(split => {
    stakingHistory.push({
      id: uuidv4(),
      originalIntentId: stakingIntent.id,
      userId: stakingIntent.userId,
      nickname: stakingIntent.nickname,
      avatar: stakingIntent.avatar,
      originalToken: stakingIntent.token,
      originalAmount: split.amount,
      finalToken: split.pool.token,
      finalAmount: split.amount,
      poolProvider: split.pool.provider,
      poolNetwork: split.pool.network,
      apr: split.pool.apr,
      lockPeriod: split.pool.lockPeriod,
      createdAt: stakingIntent.createdAt,
      completedAt: Date.now(),
      status: "completed",
      autoSwapped: false,
      isBot: stakingIntent.userId.startsWith("bot"),
      constraint: {
        risk: stakingIntent.risk_constraint,
        liquidity: stakingIntent.liquidity_constraint,
        note: stakingIntent.note
      }
    });
  });
  // Leaderboard update
  let user = leaderboard.find(u => u.nickname === stakingIntent.nickname);
  const points = splits.length;
  if (user) user.score += points;
  else leaderboard.push({ nickname: stakingIntent.nickname, avatar: stakingIntent.avatar, score: points });
  io.emit("intents_update", intentPool);
  io.emit("staking_history_update", stakingHistory);
  io.emit("leaderboard_update", leaderboard.sort((a, b) => b.score - a.score));
}

function emitBotIntent() {
  const botUser = randomChoice(botUsers);
  const action = randomChoice(["stake", "swap"]);
  if (action === "swap") {
    let fromToken = randomChoice(tokens);
    let toToken = randomChoice(tokens.filter((t) => t !== fromToken));
    let key = `${fromToken}-${toToken}`;
    let rate = swapRates[key] !== undefined ? swapRates[key] : 1;
    let amount = Number((Math.random() * 9 + 1).toFixed(2));
    let swapIntent = { id: uuidv4(), userId: botUser.id, nickname: botUser.nickname, avatar: botUser.avatar, type: "swap", fromToken, toToken, amount, rate, fromNetwork: randomChoice(networks), toNetwork: randomChoice(networks), privacy: randomChoice(privacies), createdAt: Date.now(), status: "pending" };
    intentPool.push(swapIntent);
    io.emit("intents_update", intentPool);
    matchSwapIntent(swapIntent);
  } else {
    let availableTokens = [...new Set(stakingPools.filter(p => p.available > 0).map(p => p.token))];
    if (availableTokens.length === 0) return;
    let token = randomChoice(availableTokens);
    let tokenPools = stakingPools.filter(p => p.token === token && p.available > 0);
    let maxAmount = Math.min(...tokenPools.map(p => p.available));
    let amount = Number((Math.random() * 90 + 10).toFixed(2));
    amount = Math.min(amount, maxAmount);
    let prefer_apr = randomChoice(["high", "low"]);
    let availableLockPeriods = [...new Set(tokenPools.map(p => p.lockPeriod > 0 ? "lock" : "flexible"))];
    let prefer_lock = randomChoice(availableLockPeriods);
    let stakingIntent = {
      id: uuidv4(),
      userId: botUser.id,
      nickname: botUser.nickname,
      avatar: botUser.avatar,
      type: "staking",
      token,
      amount,
      prefer_apr,
      prefer_lock: prefer_lock === "lock",
      prefer_flexible: prefer_lock === "flexible",
      risk_constraint: "none",
      liquidity_constraint: "none",
      min_apy: undefined,
      note: "",
      createdAt: Date.now(),
      status: "pending"
    };
    intentPool.push(stakingIntent);
    io.emit("intents_update", intentPool);
    setTimeout(() => { matchStakingIntent(stakingIntent); }, randomInt(1000, 2000));
  }
}
setInterval(emitBotIntent, 6000);

io.on("connection", (socket) => {
  socket.on("register", (nickname) => {
    nickname = (nickname || "").trim();
    if (!nickname || nickname.length < 3) {
      socket.emit("error", "Nickname minimal 3 karakter");
      return;
    }
    let avatar = "shrimp" + (Math.floor(Math.random() * 3) + 1);
    if (persistentUsers[nickname]) {
      users[socket.id] = {
        ...persistentUsers[nickname],
        lastActive: Date.now(),
      };
      transactionHistory[socket.id] = persistentUsers[nickname].transactionHistory || [];
      userStakes[socket.id] = persistentUsers[nickname].userStakes || [];
      avatar = persistentUsers[nickname].avatar;
    } else {
      users[socket.id] = {
        nickname,
        avatar,
        balances: { ...INITIAL_BALANCES },
        privacyScore: 0,
        lastActive: Date.now(),
      };
      transactionHistory[socket.id] = [];
      userStakes[socket.id] = [];
      persistentUsers[nickname] = {
        nickname,
        avatar,
        balances: { ...INITIAL_BALANCES },
        privacyScore: 0,
        transactionHistory: [],
        userStakes: [],
      };
    }
    setTimeout(() => {
      socket.emit("registered", users[socket.id]);
      io.emit("users_update", Object.values(users));
    }, 100);
  });

  socket.on("create_intent", (intent) => {
    const user = users[socket.id] || { nickname: "anon", avatar: "shrimp1" };
    if (intent.amount)
      intent.amount = parseFloat(String(intent.amount).replace(",", "."));
    if (intent.type === "swap" && !checkBalance(socket.id, intent.fromToken, intent.amount)) {
      socket.emit("error", `Insufficient ${intent.fromToken} balance. You have ${(user.balances[intent.fromToken] || 0).toFixed(4)}, need ${intent.amount}`);
      return;
    }
    if (intent.type === "staking" && !checkBalance(socket.id, intent.token, intent.amount)) {
      socket.emit("error", `Insufficient ${intent.token} balance. You have ${(user.balances[intent.token] || 0).toFixed(4)}, need ${intent.amount}`);
      return;
    }
    intent.id = uuidv4();
    intent.userId = socket.id;
    intent.nickname = user.nickname;
    intent.avatar = user.avatar;
    intent.createdAt = Date.now();
    intent.status = "pending";
    // Normalize staking constraint fields
    if (intent.type === "staking") {
      intent.prefer_lock = !!intent.prefer_lock;
      intent.prefer_flexible = !!intent.prefer_flexible;
      intent.risk_constraint = intent.risk_constraint || "none";
      intent.liquidity_constraint = intent.liquidity_constraint || "none";
      if (intent.min_apy !== undefined && intent.min_apy !== "") intent.min_apy = Number(intent.min_apy);
      else intent.min_apy = undefined;
      intent.note = intent.note || "";
    }
    if (intent.type === "swap") {
      let key = `${intent.fromToken}-${intent.toToken}`;
      intent.rate = swapRates[key] !== undefined ? swapRates[key] : 1;
      intentPool.push(intent);
      io.emit("intents_update", intentPool);
      matchSwapIntent(intent);
    } else if (intent.type === "staking") {
      intentPool.push(intent);
      io.emit("intents_update", intentPool);
      setTimeout(() => { matchStakingIntent(intent); }, 2000);
    }
  });

  socket.on("get_profile", () => {
    const user = users[socket.id];
    if (user) {
      socket.emit("profile_data", {
        user: user,
        stakes: userStakes[socket.id] || [],
        transactions: (transactionHistory[socket.id] || []).sort((a, b) => b.timestamp - a.timestamp)
      });
    }
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user && persistentUsers[user.nickname]) {
      persistentUsers[user.nickname].balances = { ...user.balances };
      persistentUsers[user.nickname].transactionHistory = [...(transactionHistory[socket.id] || [])];
      persistentUsers[user.nickname].userStakes = [...(userStakes[socket.id] || [])];
      persistentUsers[user.nickname].lastActive = Date.now();
    }
    delete users[socket.id];
    io.emit("users_update", Object.values(users));
  });
});

// --- CLEANUP, REST API, ETC ---
setInterval(() => {
  const tenMinutesAgo = Date.now() - 600000;
  const beforeCount = intentPool.length;
  intentPool = intentPool.filter(intent => {
    if (intent.status === "pending") return true;
    if (intent.status === "completed" && intent.completedAt > tenMinutesAgo) return true;
    return false;
  });
  if (intentPool.length !== beforeCount) {
    io.emit("intents_update", intentPool);
  }
}, 60000);

app.get("/api/intents", (req, res) => {
  const visibleIntents = intentPool.filter(i => i.type === "swap");
  res.json(visibleIntents);
});
app.get("/api/staking-intents", (req, res) => {
  const visibleIntents = intentPool.filter(i => i.type === "staking");
  res.json(visibleIntents);
});
app.get("/api/staking-history", (req, res) => {
  res.json(stakingHistory.sort((a, b) => b.completedAt - a.completedAt));
});
app.get("/api/staking-pools", (req, res) => {
  res.json(stakingPools);
});
app.get("/api/leaderboard", (req, res) => {
  res.json(leaderboard.sort((a, b) => b.score - a.score));
});
app.get("/api/swap-rates", (req, res) => {
  res.json(swapRates);
});
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    activeUsers: Object.keys(users).length,
    persistentUsers: Object.keys(persistentUsers).length,
    totalIntents: intentPool.length,
    pendingIntents: intentPool.filter(i => i.status === "pending").length,
    completedIntents: intentPool.filter(i => i.status === "completed").length,
    botIntents: intentPool.filter(i => i.userId && i.userId.startsWith("bot")).length,
    userIntents: intentPool.filter(i => i.userId && !i.userId.startsWith("bot")).length,
    stakingHistory: stakingHistory.length,
    stakingPools: stakingPools.length,
    leaderboard: leaderboard.length,
    availablePools: stakingPools.filter(p => p.available > 0).length,
    swapRates: Object.keys(swapRates).length
  });
});
app.get("/api/profile/:userId", (req, res) => {
  const userId = req.params.userId;
  const user = users[userId];
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({
    user: user,
    stakes: userStakes[userId] || [],
    transactions: (transactionHistory[userId] || []).sort((a, b) => b.timestamp - a.timestamp)
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Anoma Intent Simulator Backend running on port ${PORT}`);
});