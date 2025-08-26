// --- FRONTEND App.js REST API ONLY VERSION ---
import React, { useState, useEffect } from "react";
import IntentForm from "./components/IntentForm";
import StakingForm from "./components/StakingForm";
import IntentList from "./components/IntentList";
import StakingIntentList from "./components/StakingIntentList";
import StakingPoolList from "./components/StakingPoolList";
import Leaderboard from "./components/Leaderboard";
import Profile from "./components/Profile";
import "./styles/theme.css";

// Dynamic backend URL - use environment variable or fallback to production URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://anoma-intent-simulation-g3jj.vercel.app";

// Mock socket object for components that expect it
const mockSocket = {
  emit: (event, data) => {
    console.log("Mock socket emit:", event, data);
    // Handle events via REST API
    handleSocketEmit(event, data);
  }
};

// Handle socket-like events via REST API
const handleSocketEmit = async (event, data) => {
  try {
    switch (event) {
      case "register":
        // Simulate user registration by creating a mock user
        const userData = {
          id: Date.now().toString(),
          nickname: data,
          avatar: 'shrimp1', // Default avatar
          balances: {
            NAM: 1000.0,
            ETH: 2.5,
            BTC: 0.1,
            USDC: 5000.0
          },
          privacyScore: Math.floor(Math.random() * 100) + 1,
          totalStaked: 0,
          totalRewards: 0,
          activeIntents: 0
        };
        window.dispatchEvent(new CustomEvent('user-registered', { detail: userData }));
        break;
      case "create_intent":
        await fetch(`${BACKEND_URL}/api/intents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        window.dispatchEvent(new CustomEvent('refresh-data'));
        break;
      case "create_staking_intent":
        await fetch(`${BACKEND_URL}/api/staking-intents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        window.dispatchEvent(new CustomEvent('refresh-data'));
        break;
      default:
        console.log("Unhandled socket event:", event);
    }
  } catch (error) {
    console.error("Error handling socket emit:", error);
    window.dispatchEvent(new CustomEvent('show-error', { detail: error.message }));
  }
};

function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [intents, setIntents] = useState([]);
  const [stakingIntents, setStakingIntents] = useState([]);
  const [stakingPools, setStakingPools] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [action, setAction] = useState("swap");
  const [nickname, setNickname] = useState("");
  const [savedNickname, setSavedNickname] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connected");

  // Persistent username from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("anoma_nickname");
    if (saved) {
      setSavedNickname(saved);
      setNickname(saved);
    }
  }, []);

  // Custom event listeners for REST API responses
  useEffect(() => {
    const handleUserRegistered = (event) => {
      const userData = event.detail;
      setUser(userData);
      setPage("choice");
      localStorage.setItem("anoma_nickname", userData.nickname);
      setSavedNickname(userData.nickname);
      setNickname(userData.nickname);
      setStatus("✅ Successfully logged in!");
      setTimeout(() => setStatus(""), 3000);
    };

    const handleRefreshData = () => {
      fetchAllData();
      setStatus("✅ Data updated!");
      setTimeout(() => setStatus(""), 3000);
    };

    const handleShowError = (event) => {
      setStatus(`❌ ${event.detail}`);
      setTimeout(() => setStatus(""), 5000);
    };

    window.addEventListener('user-registered', handleUserRegistered);
    window.addEventListener('refresh-data', handleRefreshData);
    window.addEventListener('show-error', handleShowError);

    return () => {
      window.removeEventListener('user-registered', handleUserRegistered);
      window.removeEventListener('refresh-data', handleRefreshData);
      window.removeEventListener('show-error', handleShowError);
    };
  }, []);

  // Fetch all data function
  const fetchAllData = async () => {
    try {
      const [intentsRes, stakingIntentsRes, stakingPoolsRes, leaderboardRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/intents`),
        fetch(`${BACKEND_URL}/api/staking-intents`),
        fetch(`${BACKEND_URL}/api/staking-pools`),
        fetch(`${BACKEND_URL}/api/leaderboard`)
      ]);

      if (intentsRes.ok) {
        const intentsData = await intentsRes.json();
        setIntents(intentsData);
      }
      
      if (stakingIntentsRes.ok) {
        const stakingIntentsData = await stakingIntentsRes.json();
        setStakingIntents(stakingIntentsData);
      }
      
      if (stakingPoolsRes.ok) {
        const stakingPoolsData = await stakingPoolsRes.json();
        setStakingPools(stakingPoolsData);
      }
      
      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setLeaderboard(leaderboardData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setStatus("❌ Failed to load data");
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-login with saved nickname
  useEffect(() => {
    if (savedNickname && !user) {
      handleSocketEmit("register", savedNickname);
    }
  }, [savedNickname, user]);

  // Register handler with persistent nickname
  const handleRegister = (e) => {
    e.preventDefault();
    if (!nickname || nickname.length < 3) {
      setStatus("❌ Nickname minimal 3 karakter");
      setTimeout(() => setStatus(""), 3000);
      return;
    }
    
    handleSocketEmit("register", nickname);
  };

  // Logout: clear saved nickname and reset states
  const handleClearData = () => {
    localStorage.removeItem("anoma_nickname");
    setSavedNickname("");
    setUser(null);
    setNickname("");
    setPage("login");
  };

  // Refresh data periodically (simulate real-time updates)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchAllData();
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [user]);

  // LOGIN PAGE
  if (!user) {
    return (
      <div className="container">
        <header>
          <h1> Anoma Intent Simulator</h1>
          <p className="subtitle">Intent-centric | Anoma</p>
          <div style={{ fontSize: '12px', color: '#4CAF50', marginTop: '10px' }}>
            ✅ Connected (REST API)
          </div>
        </header>
        <div className="register-card">
          <h2>enter the chain</h2>
          {status && <div className="status-msg">{status}</div>}
          <form onSubmit={handleRegister}>
            <input
              name="nickname"
              placeholder="node name (Magician)"
              maxLength={20}
              minLength={3}
              required
              value={nickname}
              onChange={e => setNickname(e.target.value)}
            />
            <button type="submit" className="magic-btn">
              {savedNickname ? "Login with new nickname" : "login"} ✨
            </button>
          </form>
          {savedNickname && (
            <button type="button" className="link-btn" onClick={handleClearData}>
              Hapus Data & Mulai Baru
            </button>
          )}
        </div>
        <footer>
          <p>
            By Skypots  | ✨ Anoma Community Indonesia
          </p>
        </footer>
      </div>
    );
  }

  // MENU CHOICE PAGE
  if (page === "choice") {
    return (
      <div className="container">
        <header>
          <h1> Anoma Intent Simulator</h1>
          <div className="user-welcome">
            <img src={`/${user.avatar}.jpg`} alt="NFT Shrimp" className="shrimp-avatar-small" />
            <span>Welcome back again, <strong>{user.nickname}</strong>!</span>
            <button className="logout-btn" onClick={handleClearData}>Logout</button>
          </div>
          <div style={{ fontSize: '12px', color: '#4CAF50', marginTop: '10px' }}>
            ✅ Connected (REST API)
          </div>
        </header>
        <div className="landing-choice">
          <button onClick={() => setPage("intent")} className="magic-btn">enter Intent Form</button>
          <button onClick={() => setPage("leaderboard")} className="magic-btn">see Leaderboard & Pool</button>
          <button onClick={() => setPage("profile")} className="magic-btn">Profile & Portfolio 💰</button>
        </div>
        <footer>
          <p>
            By Skypots  | ✨ Anoma Community Indonesia
          </p>
        </footer>
      </div>
    );
  }

  if (page === "profile") {
    return (
      <>
        <Profile user={user} socket={mockSocket} />
        <div className="container">
          <button className="link-btn" onClick={() => setPage("choice")}>⬅ back to Menu</button>
          <footer>
            <p>
              By Skypots  | ✨ Anoma Community Indonesia
            </p>
          </footer>
        </div>
      </>
    );
  }

  if (page === "intent") {
    return (
      <div className="container">
        <header>
          <h1> Anoma Intent Simulator</h1>
          <div style={{ fontSize: '12px', color: '#4CAF50', marginBottom: '10px' }}>
            ✅ Connected (REST API) - Auto refresh every 10s
          </div>
        </header>
        <div className="dashboard">
          <div className="node-card">
            <img src={`/${user.avatar}.jpg`} alt="NFT Shrimp" className="shrimp-avatar" />
            <div>
              <div className="node-nick">{user.nickname}</div>
              <div className="node-balance">
                Multi-Token Balance ✅
                <div className="balance-details">
                  {Object.entries(user.balances || {}).map(([token, amount]) => (
                    <span key={token} className="balance-item">
                      {token}: {Number(amount).toFixed(4)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="node-privacy">
                Privacy Score: {user.privacyScore}
              </div>
            </div>
          </div>
          <button className="magic-btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "close Form Intent" : "open Form Intent"}
          </button>
          <button className="magic-btn" onClick={() => setPage("leaderboard")}>see Leaderboard & Pool</button>
          <button className="magic-btn" onClick={() => setPage("profile")}>Profile & Portfolio 💰</button>
          <button className="magic-btn" onClick={fetchAllData}>🔄 Refresh Data</button>
        </div>
        {showForm && (
          <>
            <div className="form-toggle">
              <button className={action === "swap" ? "active" : ""} onClick={() => setAction("swap")}>Swap Intent</button>
              <button className={action === "staking" ? "active" : ""} onClick={() => setAction("staking")}>Staking Intent</button>
            </div>
            {action === "swap" && (
              <IntentForm socket={mockSocket} setStatus={setStatus} user={user} />
            )}
            {action === "staking" && (
              <StakingForm socket={mockSocket} setStatus={setStatus} user={user} stakingPools={stakingPools} />
            )}
          </>
        )}
        {status && <div className="status-msg">{status}</div>}
        <Leaderboard leaderboard={leaderboard} />
        <button className="link-btn" onClick={() => setPage("choice")}>⬅ back to Menu</button>
        <footer>
          <p>
            By Skypots  | ✨ Anoma Community Indonesia
          </p>
        </footer>
      </div>
    );
  }

  if (page === "leaderboard") {
    return (
      <div className="container">
        <header>
          <h1> Anoma Intent Simulator</h1>
          <div style={{ fontSize: '12px', color: '#4CAF50', marginBottom: '10px' }}>
            ✅ Connected (REST API) - Auto refresh every 10s
          </div>
        </header>
        <button className="magic-btn" onClick={() => setPage("intent")}>Enter Intent Form</button>
        <button className="magic-btn" onClick={() => setPage("profile")}>Profile & Portfolio 💰</button>
        <button className="magic-btn" onClick={fetchAllData}>🔄 Refresh Data</button>
        <IntentList intents={intents} />
        <StakingIntentList intents={stakingIntents} stakingPools={stakingPools} />
        <StakingPoolList stakingPools={stakingPools} />
        <Leaderboard leaderboard={leaderboard} />
        <button className="link-btn" onClick={() => setPage("choice")}>⬅ Back to Menu</button>
        <footer>
          <p>
            By Skypots  | ✨ Anoma Community Indonesia
          </p>
        </footer>
      </div>
    );
  }

  return null;
}

export default App;
