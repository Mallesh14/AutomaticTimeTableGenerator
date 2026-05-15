const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  subjectCode: { type: String, required: true },
  name: String,
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  department: String,
  section: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  semester: Number,
  weeklyHours: Number,
  isLab: Boolean,
});

module.exports = mongoose.model('Subject', SubjectSchema);
