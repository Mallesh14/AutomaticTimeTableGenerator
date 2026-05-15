const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String },
  role: { type: String, enum: ['admin', 'student', 'faculty'], required: true },
  department: String,
  semester: Number,
  facultyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' } // ✅ Link to faculty
});

module.exports = mongoose.model('User', userSchema);
