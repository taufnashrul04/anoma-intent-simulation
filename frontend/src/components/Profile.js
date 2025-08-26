import React, { useState, useEffect } from 'react';

function Profile({ user, socket }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (socket && user) {
      // Request profile data
      socket.emit('get_profile');
      
      // Listen for profile data
      socket.on('profile_data', (data) => {
        setProfileData(data);
        setLoading(false);
      });

      // Listen for user updates (balance changes)
      socket.on('user_updated', (updatedUser) => {
        if (profileData) {
          setProfileData(prev => ({
            ...prev,
            user: updatedUser
          }));
        }
      });

      return () => {
        socket.off('profile_data');
        socket.off('user_updated');
      };
    }
  }, [socket, user]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    return parseFloat(num).toFixed(4);
  };

  const calculateStakingValue = (stakes) => {
    return stakes.reduce((total, stake) => {
      // Simple calculation: original amount (could add projected returns)
      return total + stake.amount;
    }, 0);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container">
        <div className="error">Failed to load profile</div>
      </div>
    );
  }

  const { user: userData, stakes, transactions } = profileData;
  const totalStakingValue = calculateStakingValue(stakes);

  return (
    <div className="container">
      <header>
        <h1>🦐 Profile - {userData.nickname}</h1>
      </header>

      {/* User Info Card */}
      <div className="profile-card">
        <img
          src={`/${userData.avatar}.jpg`}
          alt="NFT Shrimp"
          className="shrimp-avatar"
          style={{ width: '80px', height: '80px' }}
        />
        <div>
          <h2>{userData.nickname}</h2>
          <p>Privacy Score: {userData.privacyScore}</p>
          <p>Active Stakes: {stakes.length}</p>
          <p>Total Transactions: {transactions.length}</p>
        </div>
      </div>

      {/* Token Balances */}
      <div className="balance-card">
        <h3>💰 Token Balances</h3>
        <div className="token-grid">
          {Object.entries(userData.balances).map(([token, balance]) => (
            <div key={token} className="token-item">
              <strong>{token}:</strong> {formatNumber(balance)}
            </div>
          ))}
        </div>
      </div>

      {/* Active Stakes */}
      {stakes.length > 0 && (
        <div className="stakes-card">
          <h3>🎯 Active Staking ({stakes.length})</h3>
          <div className="stakes-summary">
            <p><strong>Total Staked Value:</strong> ${totalStakingValue.toFixed(2)}</p>
          </div>
          {stakes.map((stake) => (
            <div key={stake.id} className="stake-item">
              <div className="stake-header">
                <strong>{stake.amount} {stake.token}</strong>
                <span className="stake-status">{stake.status}</span>
              </div>
              <div className="stake-details">
                <p><strong>Pool:</strong> {stake.pool} ({stake.network})</p>
                <p><strong>APR:</strong> {stake.apr}% | <strong>Lock:</strong> {stake.lockPeriod} days</p>
                <p><strong>Started:</strong> {formatDate(stake.startDate)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction History */}
      <div className="history-card">
        <h3>📈 Transaction History ({transactions.length})</h3>
        {transactions.length === 0 ? (
          <p>No transactions yet</p>
        ) : (
          <div className="transaction-list">
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="transaction-item">
                <div className="tx-header">
                  <span className={`tx-type ${tx.type}`}>
                    {tx.type === 'swap' ? '🔄' : '🎯'} {tx.type.toUpperCase()}
                  </span>
                  <span className="tx-date">{formatDate(tx.timestamp)}</span>
                </div>
                <div className="tx-details">
                  {tx.type === 'swap' ? (
                    <p>
                      <strong>{tx.amount} {tx.fromToken}</strong> → <strong>{tx.received.toFixed(4)} {tx.toToken}</strong>
                      <br />
                      <small>Rate: 1 {tx.fromToken} = {tx.rate.toFixed(6)} {tx.toToken}</small>
                    </p>
                  ) : (
                    <p>
                      <strong>{tx.amount} {tx.token}</strong> staked in <strong>{tx.pool}</strong>
                      <br />
                      <small>APR: {tx.apr}% | Lock: {tx.lockPeriod} days</small>
                    </p>
                  )}
                </div>
              </div>
            ))}
            {transactions.length > 10 && (
              <p className="more-transactions">
                + {transactions.length - 10} more transactions...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="stats-card">
        <h3>📊 Quick Stats</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Swaps:</span>
            <span className="stat-value">{transactions.filter(tx => tx.type === 'swap').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Stakes:</span>
            <span className="stat-value">{transactions.filter(tx => tx.type === 'staking').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Positions:</span>
            <span className="stat-value">{stakes.filter(s => s.status === 'active').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg APR:</span>
            <span className="stat-value">
              {stakes.length > 0 ? (stakes.reduce((sum, s) => sum + s.apr, 0) / stakes.length).toFixed(1) + '%' : '0%'}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-card {
          display: flex;
          align-items: center;
          gap: 20px;
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          padding: 20px;
          border-radius: 15px;
          margin: 20px 0;
          color: white;
        }

        .balance-card, .stakes-card, .history-card, .stats-card {
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          border-radius: 15px;
          padding: 20px;
          margin: 20px 0;
          color: white;
        }

        .token-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .token-item {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 10px;
          text-align: center;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .stakes-summary {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 10px;
          margin: 15px 0;
        }

        .stake-item {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 15px;
          margin: 10px 0;
        }

        .stake-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .stake-status {
          background: #27ae60;
          color: white;
          padding: 4px 8px;
          border-radius: 5px;
          font-size: 12px;
          text-transform: uppercase;
        }

        .stake-details p {
          margin: 5px 0;
          font-size: 14px;
        }

        .transaction-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .transaction-item {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 12px;
          margin: 8px 0;
        }

        .tx-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .tx-type {
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 5px;
          font-size: 12px;
        }

        .tx-type.swap {
          background: #3498db;
          color: white;
        }

        .tx-type.staking {
          background: #e74c3c;
          color: white;
        }

        .tx-date {
          font-size: 12px;
          opacity: 0.8;
        }

        .tx-details p {
          margin: 5px 0;
          font-size: 14px;
        }

        .tx-details small {
          opacity: 0.7;
        }

        .more-transactions {
          text-align: center;
          font-style: italic;
          opacity: 0.7;
          margin-top: 15px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .stat-item {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 10px;
          text-align: center;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .stat-label {
          display: block;
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 5px;
        }

        .stat-value {
          display: block;
          font-size: 20px;
          font-weight: bold;
        }

        .loading, .error {
          text-align: center;
          padding: 40px;
          font-size: 18px;
        }

        .error {
          color: #e74c3c;
        }
      `}</style>
    </div>
  );
}

export default Profile;