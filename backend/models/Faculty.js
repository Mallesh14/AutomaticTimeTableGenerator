const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  name: String,
  availableSlots: [[String]], // [['Mon-1', 'Mon-2'], ['Tue-1']]
});

module.exports = mongoose.model('Faculty', FacultySchema);
