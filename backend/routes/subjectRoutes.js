const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject'); // ensure Subject model is imported
const {
  createSubject,
  getSubjects,
   getDepartments,
  getSemesters
} = require('../controllers/subjectController');

// Create and Get subjects
router.post('/', createSubject);
router.get('/', getSubjects);
router.get('/departments', getDepartments);
router.get('/semesters', getSemesters);


// ✅ Update Subject by ID
router.put('/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
          department: req.body.department,
          section: req.body.section,
          semester: req.body.semester,
          weeklyHours: req.body.weeklyHours,
          isLab: req.body.isLab,
          faculty: req.body.faculty,
        },
      },
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.json(subject);
  } catch (err) {
    console.error('❌ Error updating subject:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Delete Subject by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Subject.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting subject:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all unique sections for a department
router.get('/sections/:department', async (req, res) => {
  try {
    const department = req.params.department.toUpperCase();
    const sections = await Subject.distinct('section', { department });
    res.json(sections.filter(Boolean)); // filter out empty/null
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// Get all unique sections for a department
router.get('/sections/:department', async (req, res) => {
  try {
    const department = req.params.department.toUpperCase();
    const sections = await Subject.distinct('section', { department });
    res.json(sections.filter(Boolean)); // filter out empty/null
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

module.exports = router;
