import React from "react";
function Leaderboard({ leaderboard }) {
  return (
    <div className="leaderboard">
      <h3>Leaderboard</h3>
      <div className="leaderboard-list">
        {leaderboard.length === 0 && <div>Belum ada yang match.</div>}
        {leaderboard.map((u, i) => (
          <div key={u.nickname} className={`leaderboard-row${i < 3 ? " top" : ""}`}>
            <span className="rank">{i + 1}.</span>
            <img src={`/${u.avatar}.png`} alt="" className="shrimp-mini" />
            <b>{u.nickname}</b>
            <span className="score">Score: {u.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Leaderboard;