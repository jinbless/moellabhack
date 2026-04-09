const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'posts.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/hackathon', express.static(path.join(__dirname, 'public')));

// Helper: read posts
function readPosts() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

// Helper: write posts
function writePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

// GET posts
app.get('/hackathon/api/posts', (req, res) => {
  const posts = readPosts();
  // Sort by date descending
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

// POST new entry
app.post('/hackathon/api/posts', (req, res) => {
  const { password, organization, name, website, description } = req.body;

  if (password !== '044-202-7748!') {
    return res.status(403).json({ error: '비밀번호가 올바르지 않습니다.' });
  }

  if (!organization || !name || !website) {
    return res.status(400).json({ error: '소속, 성명, 웹사이트 주소를 모두 입력해주세요.' });
  }

  const desc = (description || '').trim().slice(0, 500);

  // Ensure website has protocol
  let url = website.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  const posts = readPosts();
  const post = {
    id: Date.now().toString(),
    organization: organization.trim(),
    name: name.trim(),
    website: url,
    description: desc,
    likes: 0,
    dislikes: 0,
    createdAt: new Date().toISOString()
  };

  posts.push(post);
  writePosts(posts);
  res.status(201).json(post);
});

// POST like
app.post('/hackathon/api/posts/:id/like', (req, res) => {
  const posts = readPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });

  post.likes += 1;
  writePosts(posts);
  res.json({ likes: post.likes, dislikes: post.dislikes });
});

// POST dislike
app.post('/hackathon/api/posts/:id/dislike', (req, res) => {
  const posts = readPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });

  post.dislikes += 1;
  writePosts(posts);
  res.json({ likes: post.likes, dislikes: post.dislikes });
});

// DELETE post
app.delete('/hackathon/api/posts/:id', (req, res) => {
  const { password } = req.body;
  if (password !== '044-202-7748!') {
    return res.status(403).json({ error: '비밀번호가 올바르지 않습니다.' });
  }

  let posts = readPosts();
  const idx = posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });

  posts.splice(idx, 1);
  writePosts(posts);
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hackathon board running on port ${PORT}`);
});
