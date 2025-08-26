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

const socket = io("http://localhost:3000");

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

  // Persistent username from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("anoma_nickname");
    if (saved) {
      setSavedNickname(saved);
      setNickname(saved);
    }
  }, []);

  useEffect(() => {
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

    fetch("http://localhost:3000/api/intents").then((r) => r.json()).then(setIntents);
    fetch("http://localhost:3000/api/staking-intents").then((r) => r.json()).then(setStakingIntents);
    fetch("http://localhost:3000/api/staking-pools").then((r) => r.json()).then(setStakingPools);
    fetch("http://localhost:3000/api/leaderboard").then((r) => r.json()).then(setLeaderboard);

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-login with saved nickname
  useEffect(() => {
    if (savedNickname && !user) {
      socket.emit("register", savedNickname);
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

  // LOGIN PAGE
  if (!user) {
    return (
      <div className="container">
        <header>
          <h1> Anoma Intent Simulator</h1>
          <p className="subtitle">Intent-centric | Anoma</p>
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
