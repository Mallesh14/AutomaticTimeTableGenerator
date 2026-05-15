const Subject = require('../models/Subject');

exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubjects = async (req, res) => {
  const subjects = await Subject.find().populate('faculty');
  res.json(subjects);
};
// subjectsController.js
exports.getDepartments = async (req, res) => {
  const departments = await Subject.distinct('department');
  res.json(departments);
};

exports.getSemesters = async (req, res) => {
  const semesters = await Subject.distinct('semester');
  res.json(semesters.sort((a, b) => a - b)); // ascending
};
