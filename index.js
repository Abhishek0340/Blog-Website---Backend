
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Post = require('./models/Post');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors(
  ['https://absbloger.netlify.app/', 'http://localhost:5173']
));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Backend is running!');
});



// Update post endpoint
app.put('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ message: 'Post updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete post endpoint
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get all posts endpoint
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find({});
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});




// Create Post endpoint
app.post('/api/posts', async (req, res) => {
  const { title, content, author, category, createdAt, thumbnail, images, keywords, subtitle, authorGmail } = req.body;
  if (!title || !content || !author || !category) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    // Try to find author by name
    let authorDoc = await User.findOne({ username: author });
    let authorValue;
    if (authorDoc) {
      authorValue = authorDoc._id;
    } else {
      // If not found, just store the author name as string
      authorValue = author;
    }
    // Store category as string
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

// Get current user info by email (for demo, expects email in query param)
app.get('/api/userinfo', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required.' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});


// Register endpoint
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = new User({ username: name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    res.json({ message: 'Login successful.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
