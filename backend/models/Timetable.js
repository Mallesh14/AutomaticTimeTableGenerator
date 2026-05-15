const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
  department: String,
  semester: Number,
  section: { type: String, enum: ['A', 'B', 'C', 'D'], required: false },
  data: Object, // Contains the timetable structure
});

module.exports = mongoose.model('Timetable', TimetableSchema);
