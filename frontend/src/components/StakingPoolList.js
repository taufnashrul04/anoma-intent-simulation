import React from "react";

function StakingPoolList({ stakingPools }) {
  return (
    <div className="intent-list">
      <h3>Staking Pools</h3>
      {stakingPools.length === 0 && <div>Tidak ada staking pool.</div>}
      {stakingPools.map((p) => (
        <div key={p.id} className="intent-card">
          <b>{p.provider}</b>: {p.token} di {p.network} | APR: <b>{p.apr}%</b> | Lock: {p.lockPeriod} hari | Tersedia: {p.available}
        </div>
      ))}
    </div>
  );
}
export default StakingPoolList;