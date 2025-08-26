import React, { useEffect, useState } from "react";

function BotActivity() {
  const [botIntents, setBotIntents] = useState([]);
  const [botLiquidity, setBotLiquidity] = useState([]);
  const [botStaking, setBotStaking] = useState([]);

  useEffect(() => {
    fetch("/api/bots")
      .then(r => r.json())
      .then(({ botIntents, botLiquidity, botStaking }) => {
        setBotIntents(botIntents);
        setBotLiquidity(botLiquidity);
        setBotStaking(botStaking);
      });
  }, []);

  return (
    <div className="container">
      <h2>Aktivitas Bot</h2>
      <div className="intent-list">
        <h3>Intent Pool (Bot)</h3>
        {botIntents.length === 0 && <div>Tidak ada intent bot.</div>}
        {botIntents.map(i => (
          <div key={i.id} className="intent-card">
            <b>{i.nickname}</b>: {i.fromToken} ({i.fromNetwork}) → {i.toToken} ({i.toNetwork}) [{i.privacy}]
          </div>
        ))}
      </div>
      <div className="intent-list">
        <h3>Liquidity Pool (Bot)</h3>
        {botLiquidity.length === 0 && <div>Tidak ada liquidity bot.</div>}
        {botLiquidity.map(l => (
          <div key={l.id} className="intent-card">
            <b>{l.nickname}</b>: {l.amountA} {l.tokenA} + {l.amountB} {l.tokenB} di {l.network}
          </div>
        ))}
      </div>
      <div className="intent-list">
        <h3>Staking Pool (Bot)</h3>
        {botStaking.length === 0 && <div>Tidak ada staking bot.</div>}
        {botStaking.map(s => (
          <div key={s.id} className="intent-card">
            <b>{s.nickname}</b>: {s.amount} {s.token} di {s.network} ({s.lockPeriod} hari)
          </div>
        ))}
      </div>
    </div>
  );
}
export default BotActivity;