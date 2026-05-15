const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Faculty = require('../models/Faculty');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not set in environment variables');

// ---------------------------
// 🔐 Register Route
// ---------------------------
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, department, semester } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already registered' });
    }

    // Role-based validations
    if (role === 'student') {
      if (!department || !semester) {
        return res.status(400).json({ error: 'Department and semester are required for students' });
      }
    }

    if (role === 'faculty') {
      if (!department) {
        return res.status(400).json({ error: 'Department is required for faculty' });
      }

      const facultyRecord = await Faculty.findOne({ email: new RegExp(`^${email}$`, 'i') }); // case-insensitive
      if (!facultyRecord) {
        return res.status(404).json({
          error: 'Faculty email not found. Please contact admin to register as faculty.',
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      department: role !== 'admin' ? department : undefined,
      semester: role === 'student' ? semester : undefined,
    });

    await newUser.save();
    res.status(201).json({ message: '✅ User registered successfully' });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// ---------------------------
// 🔐 Login Route
// ---------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email }).populate('facultyRef');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // For faculty, allow login with facultyId as password
    let isMatch = false;
    if (user.role === 'faculty') {
      // Try normal password
      isMatch = await bcrypt.compare(password, user.password);
      // If not match, try facultyId as password (in case password was set as facultyId)
      if (!isMatch && user.facultyRef && user.facultyRef.facultyId) {
        isMatch = password === user.facultyRef.facultyId;
      }
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department || '',
        semester: user.semester || '',
        facultyRef: user.facultyRef || null,
      },
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ---------------------------
// 🔐 Reset Password Route
// ---------------------------
router.post('/reset-password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('❌ Password reset error:', err);
    res.status(500).json({ error: 'Server error during password reset.' });
  }
});

module.exports = router;
