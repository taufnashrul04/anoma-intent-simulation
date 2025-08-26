// --- FRONTEND App.js PATCHED: persistent username, auto-login, logout, and decimal input support ---
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
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

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'], // Add polling as fallback for Vercel
  timeout: 20000,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

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
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Persistent username from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("anoma_nickname");
    if (saved) {
      setSavedNickname(saved);
      setNickname(saved);
    }
  }, []);

  useEffect(() => {
    // Socket connection status
    socket.on("connect", () => {
      console.log("Connected to server");
      setConnectionStatus("connected");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnectionStatus("disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionStatus("error");
      setStatus("❌ Connection error. Please check your internet connection.");
    });

    socket.on("registered", (userData) => {
      setUser(userData);
      setPage("choice");
      localStorage.setItem("anoma_nickname", userData.nickname);
      setSavedNickname(userData.nickname);
      setNickname(userData.nickname);
    });

    socket.on("intents_update", (newIntents) => {
      setIntents(newIntents.filter((i) => i.type === "swap"));
      setStakingIntents(newIntents.filter((i) => i.type === "staking"));
    });

    socket.on("leaderboard_update", setLeaderboard);

    socket.on("intent_matched", (intent) => {
      setStatus(
        `✨ Intent swap berhasil match! ${intent.fromToken} → ${intent.toToken} (${intent.amount})`
      );
      setTimeout(() => setStatus(""), 8000);
    });

    socket.on("staking_matched", (stakingData) => {
      setStatus(
        `🎯 Intent staking berhasil! ${stakingData.token} di pool ${stakingData.provider} (APR: ${stakingData.apr}%)`
      );
      setTimeout(() => setStatus(""), 8000);
    });

    socket.on("auto_swap_stake_completed", (data) => {
      setStatus(
        `🔄 Auto conversion completed! ${data.originalToken} → ${data.swappedToken} → Staking (APR: ${data.apr}%)`
      );
      setTimeout(() => setStatus(""), 10000);
    });

    socket.on("user_updated", (updatedUser) => {
      setUser(updatedUser);
    });

    socket.on("error", (errorMsg) => {
      setStatus(`❌ ${errorMsg}`);
      setTimeout(() => setStatus(""), 8000);
    });

    // Fetch initial data
    const fetchData = async () => {
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
        console.error("Failed to fetch initial data:", error);
        setStatus("❌ Failed to load initial data");
      }
    };

    fetchData();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("registered");
      socket.off("intents_update");
      socket.off("leaderboard_update");
      socket.off("intent_matched");
      socket.off("staking_matched");
      socket.off("auto_swap_stake_completed");
      socket.off("user_updated");
      socket.off("error");
    };
  }, []);

  // Auto-login with saved nickname
  useEffect(() => {
    if (savedNickname && !user && connectionStatus === "connected") {
      socket.emit("register", savedNickname);
    }
  }, [savedNickname, user, connectionStatus]);

  // Register handler with persistent nickname
  const handleRegister = (e) => {
    e.preventDefault();
    if (!nickname || nickname.length < 3) {
      setStatus("❌ Nickname minimal 3 karakter");
      setTimeout(() => setStatus(""), 3000);
      return;
    }
    
    if (connectionStatus !== "connected") {
      setStatus("❌ Not connected to server. Please wait...");
      setTimeout(() => setStatus(""), 3000);
      return;
    }
    
    socket.emit("register", nickname);
  };

  // Logout: clear saved nickname and reset states
  const handleClearData = () => {
    localStorage.removeItem("anoma_nickname");
    setSavedNickname("");
    setUser(null);
    setNickname("");
    setPage("login");
  };

  // Show connection status
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case "connecting":
        return "🔄 Connecting...";
      case "connected":
        return "✅ Connected";
      case "disconnected":
        return "⚠️ Disconnected";
      case "error":
        return "❌ Connection Error";
      default:
        return "🔄 Connecting...";
    }
  };

  // LOGIN PAGE
  if (!user) {
    return (
      <div className="container">
        <header>
          <h1> Anoma Intent Simulator</h1>
          <p className="subtitle">Intent-centric | Anoma</p>
          <div style={{ fontSize: '12px', color: connectionStatus === 'connected' ? '#4CAF50' : '#f44336', marginTop: '10px' }}>
            {getConnectionStatusDisplay()}
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
              disabled={connectionStatus !== "connected"}
            />
            <button 
              type="submit" 
              className="magic-btn"
              disabled={connectionStatus !== "connected"}
            >
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
          <div style={{ fontSize: '12px', color: connectionStatus === 'connected' ? '#4CAF50' : '#f44336', marginTop: '10px' }}>
            {getConnectionStatusDisplay()}
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
        <Profile user={user} socket={socket} />
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
          <div style={{ fontSize: '12px', color: connectionStatus === 'connected' ? '#4CAF50' : '#f44336', marginBottom: '10px' }}>
            {getConnectionStatusDisplay()}
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
        </div>
        {showForm && (
          <>
            <div className="form-toggle">
              <button className={action === "swap" ? "active" : ""} onClick={() => setAction("swap")}>Swap Intent</button>
              <button className={action === "staking" ? "active" : ""} onClick={() => setAction("staking")}>Staking Intent</button>
            </div>
            {action === "swap" && (
              <IntentForm socket={socket} setStatus={setStatus} user={user} />
            )}
            {action === "staking" && (
              <StakingForm socket={socket} setStatus={setStatus} user={user} stakingPools={stakingPools} />
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
          <div style={{ fontSize: '12px', color: connectionStatus === 'connected' ? '#4CAF50' : '#f44336', marginBottom: '10px' }}>
            {getConnectionStatusDisplay()}
          </div>
        </header>
        <button className="magic-btn" onClick={() => setPage("intent")}>Enter Intent Form</button>
        <button className="magic-btn" onClick={() => setPage("profile")}>Profile & Portfolio 💰</button>
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
