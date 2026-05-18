require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const session = require('express-session');
const jwt = require('jsonwebtoken');

const app = express();

// Game Info
const GAME_NAME = 'Flappy Beaks';
const GAME_CREATOR = 'Kuwait';
console.log(`🦩 ${GAME_NAME} by ${GAME_CREATOR} - Starting server...`);

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flappy-nft', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas
const userSchema = new mongoose.Schema({
  twitterId: String,
  twitterHandle: String,
  displayName: String,
  profileImageUrl: String,
  createdAt: { type: Date, default: Date.now }
});

const scoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  twitterHandle: String,
  score: Number,
  difficulty: { type: String, enum: ['easy', 'normal', 'hard', 'insane'] },
  streak: Number,
  powerupsCollected: Number,
  solanaSignature: String,
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Score = mongoose.model('Score', scoreSchema);

// Passport Configuration
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: '/api/auth/twitter/callback'
  },
  async (token, tokenSecret, profile, done) => {
    try {
      let user = await User.findOne({ twitterId: profile.id });
      
      if (!user) {
        user = await User.create({
          twitterId: profile.id,
          twitterHandle: profile.username,
          displayName: profile.displayName,
          profileImageUrl: profile.photos[0]?.value
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Routes
app.get('/api/auth/twitter', passport.authenticate('twitter'));

app.get('/api/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?token=${token}`);
  }
);

app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(req.user);
});

app.post('/api/scores', async (req, res) => {
  try {
    const { twitterHandle, score, difficulty, streak, powerupsCollected, solanaSignature } = req.body;
    
    const scoreDoc = await Score.create({
      twitterHandle,
      score,
      difficulty,
      streak,
      powerupsCollected,
      solanaSignature,
      userId: req.user?._id
    });
    
    res.json(scoreDoc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/scores/leaderboard/:difficulty', async (req, res) => {
  try {
    const scores = await Score.aggregate([
      { $match: { difficulty: req.params.difficulty } },
      { $sort: { score: -1 } },
      { $limit: 50 },
      {
        $group: {
          _id: '$twitterHandle',
          highScore: { $max: '$score' },
          profileImageUrl: { $first: '$profileImageUrl' }
        }
      },
      { $sort: { highScore: -1 } },
      { $limit: 20 }
    ]);
    
    res.json(scores);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/scores/:twitterHandle', async (req, res) => {
  try {
    const scores = await Score.find({ twitterHandle: req.params.twitterHandle })
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json(scores);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Solana Verification Endpoint
app.post('/api/verify-solana', async (req, res) => {
  try {
    const { signature, publicKey, message } = req.body;
    
    // TODO: Verify Solana signature here
    // This would involve calling Solana's verification function
    
    res.json({ verified: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
