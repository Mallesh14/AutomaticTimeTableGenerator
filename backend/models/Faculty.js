const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  facultyId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true }, // ✅ REQUIRED
  department: { type: String, required: true },
  availableSlots: { type: [String], default: [] }, // ✅ REQUIRED, default to empty array
  password: { type: String }, // hashed password, optional
});

module.exports = mongoose.model('Faculty', FacultySchema);