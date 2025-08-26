import React from "react";

function IntentList({ intents }) {
  return (
    <div className="intent-list">
      <h3>Intent Swap/Bridge</h3>
      {intents.length === 0 && <div>Tidak ada intent swap/bridge.</div>}
      {intents.map((i) => (
        <div key={i.id} className="intent-card">
          <b>{i.nickname}</b>: {i.amount} {i.fromToken} ({i.fromNetwork}) ➔ {i.toToken} ({i.toNetwork}) [rate: {i.rate}] [{i.privacy}]
        </div>
      ))}
    </div>
  );
}
export default IntentList;