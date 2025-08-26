import React from "react";

function matchStakingPool(intent, pools) {
  let candidates = pools.filter(p => p.token === intent.token);

  if (intent.prefer_flexible) {
    candidates = candidates.filter(p => p.flexible);
  } else {
    candidates = candidates.filter(p => !p.flexible && p.lockPeriod >= (intent.prefer_lock || 0));
  }

  if (intent.prefer_apr === "high") {
    candidates.sort((a, b) => b.apr - a.apr);
  } else if (intent.prefer_apr === "low") {
    candidates.sort((a, b) => a.apr - b.apr);
  }

  return candidates[0] || null;
}

function StakingIntentList({ intents, stakingPools }) {
  return (
    <div className="intent-list">
      <h3>Intent Staking Pool</h3>
      {intents.length === 0 && <div>Tidak ada intent staking.</div>}
      {intents.map((s) => {
        const pool = matchStakingPool(s, stakingPools);
        return (
          <div key={s.id} className="intent-card">
            <b>{s.nickname}</b>: staking {s.amount} {s.token} &mdash; APR: {s.prefer_apr === "high" ? "Tertinggi" : "Terendah"}, {s.prefer_flexible ? "Flexible" : `Min. Lock ${s.prefer_lock} hari`}
            <div className="staking-pool-hint">
              {pool ? (
                <>
                  Pool Cocok: <b style={{color:'#ffd700'}}>{pool.token}</b> di <b style={{color:'#ffd700'}}>{pool.network}</b>, APR <b style={{color:'#ffd700'}}>{pool.apr}%</b>{pool.flexible ? ", Flexible" : `, Lock ${pool.lockPeriod} hari`}
                </>
              ) : (
                <span style={{color:'#fff'}}><i>Tidak ada pool cocok.</i></span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default StakingIntentList;