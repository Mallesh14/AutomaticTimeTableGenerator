const Faculty = require('../models/Faculty');

exports.createFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body);
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFaculties = async (req, res) => {
  const faculties = await Faculty.find();
  res.json(faculties);
};
