const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('./middleware/verifyToken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const ADMIN_EMAIL = 'admin@lms.com';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Schemas FIRST
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'student' }
});
const User = mongoose.model('User', UserSchema);

const CourseSchema = new mongoose.Schema({
  title: String,
  description: String,
  instructor: String,
  createdAt: { type: Date, default: Date.now }
});
const Course = mongoose.model('Course', CourseSchema);

// ✅ Then MongoDB connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log("✅ MongoDB connected");
  const adminExists = await User.findOne({ email: ADMIN_EMAIL });
  if (!adminExists) {
    const hashed = await bcrypt.hash('Admin@123', 10);
    await User.create({ name: 'Admin', email: ADMIN_EMAIL, password: hashed, role: 'admin' });
    console.log("✅ Admin user created");
  }
})
.catch((err) => console.error("❌ MongoDB error:", err));

// Admin middleware
const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role: 'student' });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });
    const token = jwt.sign(
      { email: user.email, role: user.role, name: user.name },
      JWT_SECRET
    );
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Login error' });
  }
});

// Get all courses
app.get('/api/courses', verifyToken, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Error loading courses' });
  }
});

// Create course — Admin only
app.post('/api/courses/create', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { title, description, instructor } = req.body;
    const newCourse = new Course({ title, description, instructor });
    await newCourse.save();
    res.json({ message: 'Course added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding course' });
  }
});

// Delete course — Admin only
app.delete('/api/courses/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting course' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});