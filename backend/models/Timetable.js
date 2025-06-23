const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
  department: String,
  semester: Number,
  data: Object, // Contains the timetable structure
});

module.exports = mongoose.model('Timetable', TimetableSchema);
