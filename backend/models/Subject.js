const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: String,
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  department: String,
  semester: Number,
  weeklyHours: Number,
  isLab: Boolean,
});

module.exports = mongoose.model('Subject', SubjectSchema);
