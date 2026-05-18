# NFT Flappy Bird - Complete Deployment Guide

Full-stack game with Solana smart contract integration, Twitter OAuth, and global leaderboards.

---

## 🎮 Project Structure

```
nft-flappy/
├── frontend/                 # React game component
├── backend/                  # Node.js/Express server
│   ├── server.js
│   ├── package.json
│   └── .env
├── solana-contract/          # Anchor program
│   ├── programs/flappy_nft/
│   └── Cargo.toml
└── DEPLOYMENT_GUIDE.md
```

---

## 📋 Prerequisites

- Node.js 16+ and npm
- MongoDB (local or Atlas)
- Solana CLI tools
- Twitter API credentials (Developer Portal)
- Git

---

## 🚀 Step 1: Frontend Setup

The game is already built as an interactive React component. To deploy it independently:

### Option A: Deploy to Vercel (Recommended)

1. **Create a GitHub repo and push the frontend**
   ```bash
   git init
   git add .
   git commit -m "Initial NFT Flappy commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/nft-flappy.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project" → Import your GitHub repo
   - Add environment variables:
     ```
     REACT_APP_API_URL=https://your-backend-url.com
     REACT_APP_SOLANA_CLUSTER=mainnet-beta
     ```
   - Deploy!

### Option B: Deploy to Netlify

```bash
npm run build
# Deploy the build folder to Netlify
```

---

## 🔌 Step 2: Backend Setup

### 1. Clone/Setup Files

```bash
cd flappy-backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/flappy-nft
TWITTER_CONSUMER_KEY=your_key_here
TWITTER_CONSUMER_SECRET=your_secret_here
JWT_SECRET=generate_a_random_string_here
SOLANA_PROGRAM_ID=your_deployed_program_id
FRONTEND_URL=https://your-frontend-url.com
```

### 3. Get Twitter API Credentials

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create an App (if not already done)
3. Go to "Keys and Tokens" → "API Keys"
4. Copy:
   - API Key → `TWITTER_CONSUMER_KEY`
   - API Secret → `TWITTER_CONSUMER_SECRET`
5. Set Callback URL in Twitter settings:
   ```
   http://localhost:5000/api/auth/twitter/callback
   ```

### 4. Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB
# macOS: brew install mongodb-community
# Then start: brew services start mongodb-community

# Connection string:
MONGODB_URI=mongodb://localhost:27017/flappy-nft
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string: `mongodb+srv://...`
4. Paste into `.env`

### 5. Deploy Backend

**Option A: Railway (Easiest)**

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub"
4. Select your repo
5. Add environment variables from `.env`
6. Railway auto-deploys!

**Option B: Render**

1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repo
4. Build: `npm install`
5. Start: `npm start`
6. Add environment variables

**Option C: Vercel Serverless Functions**

Create `api/scores.js`:
```javascript
import { MongoClient } from 'mongodb';

export default async (req, res) => {
  const client = new MongoClient(process.env.MONGODB_URI);
  // Handle requests...
};
```

---

## ⛓️ Step 3: Deploy Solana Smart Contract

### 1. Install Solana Tools

```bash
# macOS/Linux
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Verify
solana --version
```

### 2. Create Wallet

```bash
solana-keygen new --outfile ~/my-solana-wallet.json
solana config set --keypair ~/my-solana-wallet.json
```

### 3. Fund Wallet (Devnet)

```bash
solana airdrop 5 $(solana address) --url devnet
solana balance
```

### 4. Build Anchor Program

```bash
cd flappy-solana-contract

# Install Anchor
npm install -g @project-serum/anchor-cli

# Build
anchor build

# Get Program ID
solana-keygen pubkey target/deploy/flappy_nft-keypair.json
```

Update `Anchor.toml`:
```toml
[programs.devnet]
flappy_nft = "YOUR_PROGRAM_ID_HERE"
```

### 5. Deploy

```bash
# To Devnet (Testing)
anchor deploy --provider.cluster devnet

# To Mainnet (Production - requires real SOL)
anchor deploy --provider.cluster mainnet-beta
```

Save the Program ID and update backend `.env`:
```
SOLANA_PROGRAM_ID=YOUR_DEPLOYED_PROGRAM_ID
```

---

## 🔗 Step 4: Connect Frontend to Backend

Update the game widget to call your API:

```javascript
// In frontend code, replace mock leaderboard fetch:
async function fetchLeaderboard() {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/api/scores/leaderboard/normal`
  );
  const data = await response.json();
  return data;
}

// Submit scores
async function submitScore(twitterHandle, score, difficulty) {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/api/scores`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        twitterHandle,
        score,
        difficulty,
        streak: window.streak,
        powerupsCollected: window.powerups
      })
    }
  );
  return response.json();
}
```

---

## 🔐 Step 5: Wallet Integration (Web3)

Install Solana Web3 packages in frontend:

```bash
npm install @solana/wallet-adapter-react @solana/wallet-adapter-base @solana/web3.js
```

Connect wallet button:

```javascript
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Game() {
  return (
    <div>
      <WalletMultiButton />
      {/* Game canvas here */}
    </div>
  );
}
```

Sign and submit scores to Solana:

```javascript
async function submitToSolana(score) {
  const wallet = useAnchorWallet();
  const program = new Program(idl, programId, provider);
  
  const tx = await program.methods
    .submitScore(twitterHandle, score, difficulty, streak, powerups)
    .accounts({
      gameState: gameStatePubkey,
      playerScore: playerScorePubkey,
      player: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([wallet])
    .rpc();
  
  return tx;
}
```

---

## 📊 Environment Variables Summary

### Frontend (.env.local)
```
REACT_APP_API_URL=https://your-backend.com
REACT_APP_SOLANA_CLUSTER=devnet
```

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/flappy-nft
TWITTER_CONSUMER_KEY=xxx
TWITTER_CONSUMER_SECRET=xxx
JWT_SECRET=random_string
SOLANA_PROGRAM_ID=xxx
SOLANA_RPC_URL=https://api.devnet.solana.com
FRONTEND_URL=https://your-frontend.com
NODE_ENV=production
```

---

## ✅ Testing Checklist

- [ ] Frontend loads on your domain
- [ ] Twitter OAuth login works
- [ ] Game runs and scores save to MongoDB
- [ ] Leaderboard populates from API
- [ ] Wallet connects to Solana
- [ ] Scores submit to smart contract
- [ ] Transaction visible on Solana Explorer

---

## 🐛 Troubleshooting

### CORS Errors
Make sure backend `.env` has correct `FRONTEND_URL` and `CORS_ORIGIN`:
```
FRONTEND_URL=https://your-frontend.com
CORS_ORIGIN=https://your-frontend.com,https://www.your-frontend.com
```

### MongoDB Connection Fails
- Check IP whitelist on MongoDB Atlas
- Verify connection string format
- Test locally first: `MONGODB_URI=mongodb://localhost:27017/flappy-nft`

### Solana Transaction Fails
- Fund wallet: `solana airdrop 2`
- Check Program ID matches `.env`
- Verify account keys in transaction

### Twitter OAuth Not Working
- Verify Callback URL in Twitter Developer Portal
- Check CONSUMER_KEY and CONSUMER_SECRET in `.env`
- Clear browser cookies and try again

---

## 📈 Future Enhancements

1. **Leaderboard Filtering**
   - By difficulty level
   - By time period (this week, this month)
   - By friends/following

2. **NFT Rewards**
   - Mint NFT for high scores
   - Stake NFT collections for bonuses
   - Rare bird variants as NFT rewards

3. **Multiplayer**
   - Real-time competitive mode
   - Challenge friends via Twitter
   - Tournament system

4. **Analytics**
   - Track gameplay metrics
   - Difficulty distribution
   - Player retention curves

5. **Monetization**
   - Premium skins/power-ups
   - Battle pass system
   - Seasonal events

---

## 📝 License & Credits

Built with ❤️ for the NFT gaming community.

For questions: reach out on Twitter or GitHub!
