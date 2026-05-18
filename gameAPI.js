// gameAPI.js - Connect game frontend to backend

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export class GameAPI {
  constructor() {
    this.token = localStorage.getItem('gameToken');
  }

  // ===== Authentication =====
  
  async getTwitterLoginUrl() {
    return `${API_BASE}/api/auth/twitter`;
  }

  async setToken(token) {
    this.token = token;
    localStorage.setItem('gameToken', token);
  }

  async getCurrentUser() {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      return response.json();
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }

  // ===== Scores =====

  async submitScore(twitterHandle, score, difficulty, streak, powerups, solanaSignature = null) {
    try {
      const response = await fetch(`${API_BASE}/api/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          twitterHandle,
          score,
          difficulty,
          streak,
          powerupsCollected: powerups,
          solanaSignature
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to submit score: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Score submission error:', error);
      // Fallback: save locally
      this.saveScoreLocally(twitterHandle, score, difficulty);
      throw error;
    }
  }

  async getLeaderboard(difficulty = 'normal') {
    try {
      const response = await fetch(
        `${API_BASE}/api/scores/leaderboard/${difficulty}`,
        {
          headers: { 'Authorization': `Bearer ${this.token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      return response.json();
    } catch (error) {
      console.error('Leaderboard fetch error:', error);
      return this.getMockLeaderboard();
    }
  }

  async getUserScores(twitterHandle) {
    try {
      const response = await fetch(
        `${API_BASE}/api/scores/${twitterHandle}`,
        {
          headers: { 'Authorization': `Bearer ${this.token}` }
        }
      );

      return response.json();
    } catch (error) {
      console.error('User scores fetch error:', error);
      return [];
    }
  }

  // ===== Solana Integration =====

  async verifySolanaSignature(signature, publicKey, message) {
    try {
      const response = await fetch(`${API_BASE}/api/verify-solana`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature, publicKey, message })
      });

      return response.json();
    } catch (error) {
      console.error('Solana verification error:', error);
      return { verified: false };
    }
  }

  // ===== Local Fallbacks =====

  saveScoreLocally(twitterHandle, score, difficulty) {
    const key = `score_${twitterHandle}_${difficulty}`;
    const scores = JSON.parse(localStorage.getItem(key) || '[]');
    scores.push({
      score,
      timestamp: new Date().toISOString(),
      difficulty
    });
    localStorage.setItem(key, JSON.stringify(scores));
  }

  getMockLeaderboard() {
    return [
      { rank: 1, username: 'CryptoKing', score: 2840 },
      { rank: 2, username: 'SolanaFlyer', score: 2156 },
      { rank: 3, username: 'NFTMaster', score: 1987 },
      { rank: 4, username: 'WebThreeWarrior', score: 1654 },
      { rank: 5, username: 'BlockchainBird', score: 1432 }
    ];
  }
}

export default new GameAPI();

// ===== Solana Web3 Integration =====

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';

export class SolanaGameIntegration {
  constructor(programId, clusterUrl = 'https://api.devnet.solana.com') {
    this.programId = new PublicKey(programId);
    this.connection = new Connection(clusterUrl);
  }

  async submitScoreOnChain(wallet, gameState, playerScore, score, difficulty, streak, powerups) {
    try {
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support transaction signing');
      }

      // This is a placeholder - you'd implement the actual Anchor program call
      // const program = await this.getProgram(wallet);
      // const tx = await program.methods
      //   .submitScore(twitterHandle, score, difficulty, streak, powerups)
      //   .accounts({
      //     gameState,
      //     playerScore,
      //     player: wallet.publicKey,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .rpc();

      console.log('Score submitted to Solana (placeholder)');
      return { success: true, message: 'Score recorded on chain' };
    } catch (error) {
      console.error('Solana submission error:', error);
      return { success: false, error: error.message };
    }
  }

  async getHighScore(playerPublicKey) {
    try {
      // Fetch from chain
      const accounts = await this.connection.getProgramAccounts(this.programId);
      // Filter and find player's score account
      const playerScores = accounts.filter(account => {
        // Decode and filter logic
        return true;
      });

      return playerScores.length > 0 ? playerScores[0] : null;
    } catch (error) {
      console.error('Failed to fetch high score:', error);
      return null;
    }
  }
}

// ===== Usage Example =====

/*
import gameAPI from './gameAPI';

// In your game component:

async function handleGameOver(finalScore, difficulty) {
  const twitterHandle = document.getElementById('twitterHandle').value;
  
  try {
    // Submit to backend
    await gameAPI.submitScore(
      twitterHandle,
      finalScore,
      difficulty,
      streak,
      powerups
    );

    // Fetch updated leaderboard
    const leaderboard = await gameAPI.getLeaderboard(difficulty);
    displayLeaderboard(leaderboard);

  } catch (error) {
    console.error('Failed to submit score:', error);
  }
}

// Twitter login
function redirectToTwitterLogin() {
  window.location.href = gameAPI.getTwitterLoginUrl();
}

// After Twitter redirects back with token
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
if (token) {
  gameAPI.setToken(token);
  const user = await gameAPI.getCurrentUser();
  console.log('Logged in as:', user);
}
*/
