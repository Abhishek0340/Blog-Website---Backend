require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

const User = require('./models/User');
const Post = require('./models/Post');
const Feedback = require('./models/Feedback');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow frontend domains
const allowedOrigins = [
  'http://localhost:5173',          // for local dev
  'https://absbloger.netlify.app',  // backup frontend
  'https://trendyblogs.site',       // your main frontend
  'https://blog-website-backend-wcn7.onrender.com'           // backend url
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log('❌ Blocked by CORS:', origin);
        return callback(new Error('CORS not allowed'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

app.use(express.json());

// ✅ Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));


// ✅ Test endpoint
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// ✅ Get user info
app.get('/api/userinfo', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required.' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({
      username: user.username || user.name,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ✅ Get all users (admin)
app.get('/api/register', async (req, res) => {
  try {
    const isAdmin =
      req.query.isAdmin === 'true' || req.headers['x-admin'] === 'true';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error fetching users.' });
  }
});

// ✅ Register User
app.post('/api/register', async (req, res) => {
  const { name, email, password, isAdmin } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields are required.' });

  try {
    // Check for email duplication
    const emailExist = await User.findOne({ email });
    if (emailExist)
      return res.status(400).json({ error: 'Email already registered.' });

    // Check for username duplication
    const usernameExist = await User.findOne({ username: name });
    if (usernameExist)
      return res.status(400).json({ error: 'Username already taken.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: name,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false,
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: 'Server error.' });
  }
});


// ✅ Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'All fields are required.' });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: 'In                                                                         valid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid email or password.' });

    res.json({
      message: 'Login successful.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.put('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ message: 'Post updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find({});
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/posts', async (req, res) => {
  const { title, content, author, category, createdAt, thumbnail, images, keywords, subtitle, authorGmail } = req.body;
  if (!title || !content || !author || !category) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    let authorDoc = await User.findOne({ username: author });
    let authorValue;
    if (authorDoc) {
      authorValue = authorDoc._id;
    } else {
      authorValue = author;
    }
    const post = new Post({
      title,
      content,
      author: authorValue,
      category,
      createdAt: createdAt ? new Date(createdAt) : undefined,
      thumbnail,
      images,
      keywords,
      subtitle,
      authorGmail
    });
    await post.save();
    res.status(201).json({ message: 'Post created successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Feedback
app.post('/api/feedback', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const newFeedback = new Feedback({
      name,
      email,
      message,
      date: new Date()
    });

    await newFeedback.save();

    res.status(201).json({ 
      success: true, 
      message: "Feedback submitted successfully." 
    });

  } catch (error) {
    console.error("❌ Error saving feedback:", error);
    res.status(500).json({ error: "Server error." });
  }
});


app.get('/api/feedback', async (req, res) => {
  try{
    const feedback = await Feedback.find({});
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error : 'Server error.'});
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
