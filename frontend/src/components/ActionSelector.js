import React from "react";

const ACTIONS = [
  {
    key: "swapbridge",
    label: "Swap / Bridge",
    desc: "Tukar token dalam satu jaringan (swap) atau lintas jaringan (bridge).",
  },
  {
    key: "liquidity",
    label: "Liquidity Provider",
    desc: "Tambahkan liquidity (dua token) ke pool dan dapatkan reward.",
  },
  {
    key: "staking",
    label: "Staking",
    desc: "Stake token untuk mendapatkan reward periodik.",
  },
];

function ActionSelector({ selected, setSelected }) {
  return (
    <div className="action-selector">
      <h2>Pilih Aksi DeFi</h2>
      <div className="action-options">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            className={`action-btn ${selected === a.key ? "selected" : ""}`}
            onClick={() => setSelected(a.key)}
          >
            {a.label}
          </button>
        ))}
      </div>
      {selected && (
        <div className="action-desc">
          <strong>Keterangan:</strong> {ACTIONS.find((a) => a.key === selected)?.desc}
        </div>
      )}
    </div>
  );
}
export default ActionSelector;