const User = require('../models/User');
const Faculty = require('../models/Faculty');
const bcrypt = require('bcryptjs');
// exports.registerUser = async (req, res) => {
//   try {
//     const { username, email, role, department, semester } = req.body;

//     const exists = await User.findOne({ username });
//     if (exists) return res.status(409).json({ message: 'User already exists' });

//     const user = await User.create({ username, email, role, department, semester });
//     res.status(201).json(user);
//   } catch (err) {
//     console.error('❌ User creation error:', err);
//     res.status(500).json({ error: err.message });
//   }
// };
exports.registerUser = async (req, res) => {
  try {
    let { username, email, password, role, department, semester, facultyId } = req.body;

    // For faculty, use facultyId as username and password if not provided
    let facultyRef = null;
    if (role === 'faculty') {
      const faculty = await Faculty.findOne({ email });
      if (!faculty) {
        return res.status(400).json({ error: 'Faculty email not found in records. Please contact admin.' });
      }
      facultyRef = faculty._id;
      if (!facultyId) facultyId = faculty.facultyId;
      if (!username) username = facultyId;
      if (!password) password = facultyId;
      department = faculty.department;
    }

    // Check duplicate (by username or email)
    const existing = await User.findOne({ $or: [ { username }, { email } ] });
    if (existing) return res.status(400).json({ error: 'Username or email already exists' });

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const newUser = new User({
      username,
      email,
      password: hashedPassword || null,
      role,
      department,
      semester: role === 'student' ? semester : undefined,
      facultyRef,
    });

    await newUser.save();
    res.status(201).json({ message: 'Registration successful' });

  } catch (err) {
    console.error('❌ Registration Error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
