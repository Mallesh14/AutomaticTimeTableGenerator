const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const facultyRoutes = require('./routes/facultyRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const timetableRoutes = require('./routes/timetableRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);                 // ✅ Login/Register
app.use('/api/faculties', facultyRoutes);         // ✅ Manage Faculty
app.use('/api/subjects', subjectRoutes);          // ✅ Manage Subjects
app.use('/api/timetable', timetableRoutes);  
app.use('/api',timetableRoutes);   // ✅ Timetable Generation + Fetch/Delete
app.use('/api', protectedRoutes);  // ✅ Protected routes (if needed, like profile/dashboard)

// Default route
app.get('/', (req, res) => {
  res.send('🚀 College Timetable Generator API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
