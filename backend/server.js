const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/faculties', require('./routes/facultyRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
