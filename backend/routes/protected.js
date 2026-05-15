const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');

// Example: Student dashboard
router.get('/student/:dept/:sem',
  authenticate, authorize(['student']),
  async (req, res) => {
    const tt = await Timetable.findOne({ department: req.params.dept, semester:Number(req.params.sem) });
    res.json(tt?.data || {});
});

// Example: Faculty dashboard
router.get('/faculty/dashboard',
  authenticate, authorize(['faculty']),
  async (req, res) => {
    const subs = await Subject.find({ faculty: req.user.userId }).populate('faculty');
    res.json(subs);
});

module.exports = router;
