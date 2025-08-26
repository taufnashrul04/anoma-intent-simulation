import React, { useState, useEffect } from "react";

const tokens = ["ETH", "BNB", "AVAX", "USDT", "USDC", "ANOMA"];
const networks = [
  "Anoma",
  "Ethereum",
  "Cosmos",
  "Arbitrum",
  "Optimism",
  "BNB",
  "Solana",
  "AVAX",
];
const privacies = ["high", "medium", "low"];

const swapRates = {
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

const tokenDesc = {
  ETH: "Native token  Ethereum.",
  BNB: "Native token  Binance Smart Chain.",
  AVAX: "Native token  Avalanche.",
  USDT: "Stablecoin  (Tether).",
  USDC: "Stablecoin  (USD Coin).",
  ANOMA: "Native token in Anoma."
};

const networkDesc = {
  Anoma: " blockchain Anoma.",
  Ethereum: " blockchain Ethereum.",
  Cosmos: " Cosmos.",
  Arbitrum: "Layer-2 in Ethereum.",
  Optimism: "Layer-2 in Ethereum.",
  BNB: " Binance Smart Chain.",
  Solana: " Solana.",
  AVAX: " Avalanche."
};

const privacyDesc = {
  high: "Privacy high - swaps are harder to track, matching is more selective.",
  medium: "Privacy medium - balance between privacy & speed.",
  low: "Privacy low - faster swap, lower privacy."
};

function IntentForm({ socket, setStatus, user }) {
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [fromNetwork, setFromNetwork] = useState(networks[0]);
  const [toToken, setToToken] = useState(tokens[1]);
  const [toNetwork, setToNetwork] = useState(networks[1]);
  const [amount, setAmount] = useState("");
  const [privacy, setPrivacy] = useState(privacies[0]);
  const [rate, setRate] = useState(1);
  const [estimatedReceive, setEstimatedReceive] = useState(0);

  useEffect(() => {
    const key = `${fromToken}-${toToken}`;
    setRate(swapRates[key] !== undefined ? swapRates[key] : 1);
  }, [fromToken, toToken]);

  useEffect(() => {
    // Calculate estimated receive
    let amt = parseFloat(String(amount).replace(",", "."));
    if (!isNaN(amt) && amt > 0) {
      setEstimatedReceive(amt * rate);
    } else {
      setEstimatedReceive(0);
    }
  }, [amount, rate]);

  const desc =
    fromNetwork === toNetwork
      ? "Swap: swap token in one chain (rate applied)."
      : "Bridge: swap token bridging chain (rate applied).";

  const handleAmountChange = (e) => {
    let val = e.target.value.replace(/[^\d.,]/g, "");
    setAmount(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let amt = parseFloat(String(amount).replace(",", "."));
    if (!fromToken || !toToken || isNaN(amt) || amt <= 0) {
      setStatus("❌ Fill valid amount (>0, use ./, for decimal)");
      return;
    }
    socket.emit("create_intent", {
      type: "swap",
      fromToken,
      toToken,
      fromNetwork,
      toNetwork,
      amount: amt,
      privacy,
    });
    setStatus("Intent send! wait matching...");
    setAmount("");
  };

  return (
    <form className="intent-form" onSubmit={handleSubmit}>
      <h2>Make Intent Swap / Bridge</h2>
      <div className="intent-desc">{desc}</div>
      {/* Token input */}
      <div className="form-label">from Token</div>
      <div className="form-row">
        <select value={fromToken} onChange={e => setFromToken(e.target.value)} required>
          {tokens.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <span className="form-hint">{tokenDesc[fromToken]}</span>
      </div>
      <div className="form-label">From Chain</div>
      <div className="form-row">
        <select value={fromNetwork} onChange={e => setFromNetwork(e.target.value)}>
          {networks.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <span className="form-hint">{networkDesc[fromNetwork]}</span>
      </div>
      <div className="form-label">To Token</div>
      <div className="form-row">
        <select value={toToken} onChange={e => setToToken(e.target.value)} required>
          {tokens.filter((t) => t !== fromToken).map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <span className="form-hint">{tokenDesc[toToken]}</span>
      </div>
      <div className="form-label">Destination chain</div>
      <div className="form-row">
        <select value={toNetwork} onChange={e => setToNetwork(e.target.value)}>
          {networks.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <span className="form-hint">{networkDesc[toNetwork]}</span>
      </div>
      <div className="form-label">Amount & Privacy</div>
      <div className="form-row">
        <input
          type="text"
          pattern="^\d*([.,]\d{0,6})?$"
          value={amount}
          onChange={handleAmountChange}
          required
          placeholder="Amount (can decimal, ./,)"
          autoComplete="off"
        />
        <select value={privacy} onChange={e => setPrivacy(e.target.value)}>
          {privacies.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="form-hint">{privacyDesc[privacy]}</div>
      <div className="rate-info" style={{ fontSize: "13px", color: "#333" }}>
        Rate: 1 {fromToken} = {rate} {toToken}
        <br />
        Balance {fromToken}: {user?.balances?.[fromToken]?.toFixed(4) ?? 0}
      </div>
      {parseFloat(amount.replace(",", ".")) > 0 && (
        <div className="convert-result" style={{ margin: "8px 0", color: "#007b5e", fontWeight: "bold" }}>
          You will receive {estimatedReceive.toFixed(6)} {toToken}
        </div>
      )}
      <button type="submit" className="magic-btn">
        send Intent ✨
      </button>
    </form>
  );
}
export default IntentForm;