require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

const User = require('./models/User');
const Post = require('./models/Post');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow frontend domains
app.use(
  cors({
    origin: ['https://absbloger.netlify.app', 'http://localhost:5173'],
    credentials: true,
  })
);

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

// ✅ Update Post
app.put('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    await generateSitemap(); // Update sitemap
    res.json({ message: 'Post updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ✅ Delete Post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    await generateSitemap(); // Update sitemap
    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ✅ Get All Posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find({});
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ✅ Create Post
app.post('/api/posts', async (req, res) => {
  const {
    title,
    content,
    author,
    category,
    createdAt,
    thumbnail,
    images,
    keywords,
    subtitle,
    authorGmail,
  } = req.body;

  if (!title || !content || !author || !category) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    let authorDoc = await User.findOne({ username: author });
    const authorValue = authorDoc ? authorDoc._id : author;

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
      authorGmail,
    });

    await post.save();
    await generateSitemap();

    res.status(201).json({ message: 'Post created successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
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
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: 'Email already registered.' });

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
      return res.status(401).json({ error: 'Invalid email or password.' });

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});







// require('dotenv').config();

// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const bcrypt = require('bcrypt');
// const User = require('./models/User');
// const Post = require('./models/Post');

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors(
//   ['https://absbloger.netlify.app/', 'http://localhost:5173']
// ));

// app.use(express.json());

// // Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB connected'))
//   .catch((err) => console.error('MongoDB connection error:', err));

// app.get('/', (req, res) => {
//   res.send('Backend is running!');
// });



// // Update post endpoint
// app.put('/api/posts/:id', async (req, res) => {
//   try {
//     const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!post) return res.status(404).json({ error: 'Post not found.' });
//     res.json({ message: 'Post updated successfully.' });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error.' });
//   }
// });

// // Delete post endpoint
// app.delete('/api/posts/:id', async (req, res) => {
//   try {
//     const post = await Post.findByIdAndDelete(req.params.id);
//     if (!post) return res.status(404).json({ error: 'Post not found.' });
//     res.json({ message: 'Post deleted successfully.' });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error.' });
//   }
// });

// // Get all posts endpoint
// app.get('/api/posts', async (req, res) => {
//   try {
//     const posts = await Post.find({});
//     res.json(posts);
//   } catch (err) {
//     res.status(500).json({ error: 'Server error.' });
//   }
// });




// // Create Post endpoint
// app.post('/api/posts', async (req, res) => {
//   const { title, content, author, category, createdAt, thumbnail, images, keywords, subtitle, authorGmail } = req.body;
//   if (!title || !content || !author || !category) {
//     return res.status(400).json({ error: 'Missing required fields.' });
//   }
//   try {
//     // Try to find author by name
//     let authorDoc = await User.findOne({ username: author });
//     let authorValue;
//     if (authorDoc) {
//       authorValue = authorDoc._id;
//     } else {
//       // If not found, just store the author name as string
//       authorValue = author;
//     }
//     // Store category as string
//     const post = new Post({
//       title,
//       content,
//       author: authorValue,
//       category,
//       createdAt: createdAt ? new Date(createdAt) : undefined,
//       thumbnail,
//       images,
//       keywords,
//       subtitle,
//       authorGmail
//     });
//     await post.save();
//     res.status(201).json({ message: 'Post created successfully.' });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error.' });
//   }
// });

// // Get current user info by email (for demo, expects email in query param)
// // app.get('/api/userinfo', async (req, res) => {
// //   const { email } = req.query;
// //   if (!email) return res.status(400).json({ error: 'Email required.' });
// //   try {
// //     const user = await User.findOne({ email });
// //     if (!user) return res.status(404).json({ error: 'User not found.' });
// //     res.json({ username: user.username, email: user.email });
// //   } catch (err) {
// //     res.status(500).json({ error: 'Server error.' });
// //   }
// // });


// // Get current user info by email
// app.get('/api/userinfo', async (req, res) => {
//   const { email } = req.query;
//   if (!email) return res.status(400).json({ error: 'Email required.' });

//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ error: 'User not found.' });

//     res.json({
//       username: user.username || user.name,
//       email: user.email
//     });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error.' });
//   }
// });





// // // Register endpoint
// // app.post('/api/register', async (req, res) => {
// //   const { name, email, password } = req.body;
// //   if (!name || !email || !password) {
// //     return res.status(400).json({ error: 'All fields are required.' });
// //   }
// //   try {
// //     const existingUser = await User.findOne({ email });
// //     if (existingUser) {
// //       return res.status(400).json({ error: 'Email already registered.' });
// //     }

// //     const saltRounds = 10;
// //     const hashedPassword = await bcrypt.hash(password, saltRounds);

// //     const user = new User({ username: name, email, password: hashedPassword });
// //     await user.save();

// //     // Return user info
// //     res.status(201).json({
// //       message: 'User registered successfully.',
// //       user: {
// //         id: user._id,
// //         username: user.username,
// //         email: user.email
// //       }
// //     });
// //   } catch (err) {
// //     res.status(500).json({ error: 'Server error.' });
// //   }
// // });

// // // Login endpoint
// // app.post('/api/login', async (req, res) => {
// //   const { email, password } = req.body;
// //   if (!email || !password) {
// //     return res.status(400).json({ error: 'All fields are required.' });
// //   }
// //   try {
// //     const user = await User.findOne({ email });
// //     if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

// //     const isMatch = await bcrypt.compare(password, user.password);
// //     if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });

// //     // Return user info
// //     res.json({
// //       message: 'Login successful.',
// //       user: {
// //         id: user._id,
// //         username: user.username,
// //         email: user.email
// //       }
// //     });
// //   } catch (err) {
// //     res.status(500).json({ error: 'Server error.' });
// //   }
// // });

// // ✅ Get all registered users (for admin dashboard)
// app.get("/api/register", async (req, res) => {
//   try {
//     // Optional: only allow admins
//     const isAdmin = req.query.isAdmin === "true" || req.headers["x-admin"] === "true";
//     if (!isAdmin) {
//       return res.status(403).json({ error: "Access denied. Admins only." });
//     }

//     // Fetch all users, exclude password for safety
//     const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
//     res.status(200).json(users);
//   } catch (err) {
//     console.error("Error fetching users:", err);
//     res.status(500).json({ error: "Server error fetching users." });
//   }
// });


// app.post("/api/register", async (req, res) => {
//   const { name, email, password, isAdmin } = req.body;
//   if (!name || !email || !password) {
//     return res.status(400).json({ error: "All fields are required." });
//   }

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ error: "Email already registered." });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // `isAdmin` is optional (false by default)
//     const user = new User({
//       username: name,
//       email,
//       password: hashedPassword,
//       isAdmin: isAdmin || false,
//     });

//     await user.save();

//     res.status(201).json({
//       message: "User registered successfully.",
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         isAdmin: user.isAdmin,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error." });
//   }
// });


// // ✅ Login endpoint
// app.post("/api/login", async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return res.status(400).json({ error: "All fields are required." });
//   }

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ error: "Invalid email or password." });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ error: "Invalid email or password." });
//     }

//     // ✅ Include admin info in response
//     res.json({
//       message: "Login successful.",
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         isAdmin: user.isAdmin,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error." });
//   }
// });


// app.get("/sitemap.xml", async (req, res) => {
//   try {
//     const domain = "https://trendyblogs.site";

//     const staticRoutes = [
//       "/",
//       "/login",
//       "/register",
//       "/dashboard",
//       "/post",
//       "/managepost",
//       "/profile",
//       "/users",
//       "/support",
//       "/terms-and-conditions",
//       "/privacy-policy",
//     ];

//     const posts = await Post.find().sort({ updatedAt: -1 });

//     const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
// <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
// ${staticRoutes
//   .map(
//     (route) => `
//   <url>
//     <loc>${domain}${route}</loc>
//     <changefreq>weekly</changefreq>
//     <priority>${route === "/" ? "1.0" : "0.7"}</priority>
//   </url>`
//   )
//   .join("")}
// ${posts
//   .map(
//     (post) => `
//   <url>
//     <loc>${domain}/blog/${encodeURIComponent(
//       post.title
//         .toLowerCase()
//         .replace(/[^a-z0-9]+/g, "-")
//         .replace(/(^-|-$)+/g, "")
//     )}</loc>
//     <lastmod>${new Date(post.updatedAt || post.createdAt).toISOString()}</lastmod>
//     <changefreq>weekly</changefreq>
//     <priority>0.9</priority>
//   </url>`
//   )
//   .join("")}
// </urlset>`;

//     res.header("Content-Type", "application/xml");
//     res.send(sitemap);
//   } catch (err) {
//     console.error("Error generating sitemap:", err);
//     res.status(500).send("Server error generating sitemap.");
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });