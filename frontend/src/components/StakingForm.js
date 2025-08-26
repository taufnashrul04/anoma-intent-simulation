import React, { useState } from "react";

const tokens = ["ETH", "BNB", "AVAX", "USDT", "USDC", "ANOMA"];
const riskOpts = [
  { value: "bluechip", label: "only blue-chip protocols" },
  { value: "max20", label: "Max 20% in 1 protocol" },
  { value: "noexp", label: "Do not use experimental validator" },
  { value: "none", label: "free (default)" }
];
const liquidityOpts = [
  { value: "liquid", label: "Must be liquid staking tokens" },
  { value: "unstake48", label: "Can unstake in 48 hours" },
  { value: "none", label: "free (default)" }
];

function StakingForm({ socket, setStatus }) {
  const [token, setToken] = useState(tokens[0]);
  const [amount, setAmount] = useState("");
  const [aprPref, setAprPref] = useState("high");
  const [lockPref, setLockPref] = useState("lock");
  const [risk, setRisk] = useState("none");
  const [liquidity, setLiquidity] = useState("none");
  const [minApy, setMinApy] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    socket.emit("create_intent", {
      type: "staking",
      token,
      amount: Number(amount),
      prefer_apr: aprPref,
      prefer_lock: lockPref === "lock",
      prefer_flexible: lockPref === "flexible",
      risk_constraint: risk,
      liquidity_constraint: liquidity,
      min_apy: minApy ? Number(minApy) : undefined,
      note: note.trim()
    });
    setStatus("Intent staking sended! Solver will find the best solution according to your preferences..");
  };

  return (
    <form className="intent-form" onSubmit={handleSubmit}>
      <h2>Intent Staking</h2>
      <div className="intent-desc">
        Fill in your staking preferences. The system will automatically find a solution (can be single pool, multi-protocol, split, etc.).
      </div>
      <div className="form-label">Token & amount</div>
      <div className="form-row">
        <select value={token} onChange={e => setToken(e.target.value)}>
          {tokens.map(t => <option key={t}>{t}</option>)}
        </select>
        <input
          type="number"
          min={0.0001}
          step="any"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
          placeholder="amount Token (can be decimal)"
        />
      </div>
      <div className="form-label">Preference APR</div>
      <div className="form-row">
        <select value={aprPref} onChange={e => setAprPref(e.target.value)}>
          <option value="high">APR highest </option>
          <option value="low">APR lower </option>
        </select>
      </div>
      <div className="form-label">Lock/Flexible</div>
      <div className="form-row">
        <select value={lockPref} onChange={e => setLockPref(e.target.value)}>
          <option value="lock">Lock </option>
          <option value="flexible">Flexible </option>
        </select>
      </div>
      <div className="form-label">Risk Constraint <span className="form-hint">(opsional)</span></div>
      <div className="form-row">
        <select value={risk} onChange={e => setRisk(e.target.value)}>
          {riskOpts.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>
      <div className="form-label">Liquidity Constraint <span className="form-hint">(opsional)</span></div>
      <div className="form-row">
        <select value={liquidity} onChange={e => setLiquidity(e.target.value)}>
          {liquidityOpts.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>
      <div className="form-label">Minimum APY <span className="form-hint">(opsional, %)</span></div>
      <div className="form-row">
        <input
          type="number"
          min={0}
          step="any"
          value={minApy}
          onChange={e => setMinApy(e.target.value)}
          placeholder="example: 5"
        />
      </div>
      <div className="form-label">special note <span className="form-hint">(opsional)</span></div>
      <div className="form-row">
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="For example: Diversification, auto-compound, etc."
        />
      </div>
      <button type="submit" className="magic-btn">send Intent Staking ✨</button>
    </form>
  );
}
export default StakingForm;