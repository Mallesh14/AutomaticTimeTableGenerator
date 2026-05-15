const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');

// ✅ Create a new faculty (public route)
router.post('/', async (req, res) => {
  try {
    const { facultyId, name, email, department, availableSlots } = req.body;
    if (!facultyId || !name || !email || !department || !Array.isArray(availableSlots)) {
      return res.status(400).json({ error: 'Faculty ID, name, email, department, and availableSlots are required.' });
    }

    // Check for duplicate email or facultyId in Faculty
    const existingFaculty = await Faculty.findOne({ $or: [
      { email: new RegExp(`^${email}$`, 'i') },
      { facultyId: new RegExp(`^${facultyId}$`, 'i') }
    ] });
    if (existingFaculty) {
      return res.status(409).json({ error: 'Faculty with this email or ID already exists.' });
    }

    // Create Faculty
    const faculty = new Faculty({
      facultyId,
      name,
      email,
      department,
      availableSlots
    });
    await faculty.save();

    // Create User for faculty login (always, and use email as username if name missing)
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(facultyId, 10);
    // Check for duplicate user by email or username
    const userExists = await User.findOne({ $or: [ { email }, { username: name || email } ] });
    if (!userExists) {
      await User.create({
        username: name || email,
        email,
        password: hashedPassword,
        role: 'faculty',
        department,
        facultyRef: faculty._id
      });
    }

    res.status(201).json(faculty);
  } catch (err) {
    console.error('❌ Error creating faculty:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all faculties (public)
router.get('/', async (req, res) => {
  try {
    const faculties = await Faculty.find();
    res.json(faculties);
  } catch (err) {
    console.error('❌ Error fetching faculties:', err);
    res.status(500).json({ error: 'Failed to get faculties' });
  }
});

// ✅ Faculty dashboard (GET subjects using email)
router.get('/dashboard/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const faculty = await Faculty.findOne({ email });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    const subjects = await Subject.find({ faculty: faculty._id });
    const totalHours = subjects.reduce((sum, sub) => sum + (sub.weeklyHours || 0), 0);

    const subjectNames = subjects.map(s => s.name);
    const subjectDeptMap = {};
    subjects.forEach(s => {
      subjectDeptMap[s.name] = s.department;
    });

    // ✅ Collect relevant timetable entries from all departments/semesters
    const timetableEntries = await Timetable.find({
      $or: subjects.map(sub => ({
        department: sub.department,
        semester: sub.semester,
      })),
    });

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const timetable = {};

    // Initialize empty timetable
    days.forEach(day => {
      timetable[day] = Array(7).fill(null);
    });

    // ✅ Merge all matching subject slots from different timetable entries
    timetableEntries.forEach(entry => {
      days.forEach(day => {
        const slots = entry.data[day] || [];
        slots.forEach((slot, idx) => {
          if (
            slot &&
            subjectNames.includes(slot.subject)
          ) {
            timetable[day][idx] = {
              ...slot,
              department: subjectDeptMap[slot.subject] || 'N/A'
            };
          }
        });
      });
    });

    res.json({
      facultyName: faculty.name,
      facultyEmail: faculty.email,
      department: faculty.department,
      totalHours,
      subjects,
      timetable,
    });
  } catch (err) {
    console.error('❌ Faculty dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Get timetable for faculty by filtering subject names
router.get('/timetable', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const faculty = await Faculty.findOne({ email });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    const subjects = await Subject.find({ faculty: faculty._id });
    if (!subjects.length) return res.json({ timetable: null });

    const subjectNames = subjects.map(s => s.name);
    const subjectDeptMap = {};
    subjects.forEach(s => {
      subjectDeptMap[s.name] = s.department;
    });

    const timetableEntries = await Timetable.find({
      $or: subjects.map(sub => ({
        department: sub.department,
        semester: sub.semester,
      })),
    });

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const timetable = {};

    days.forEach(day => {
      timetable[day] = Array(7).fill(null);
    });

    timetableEntries.forEach(entry => {
      days.forEach(day => {
        const slots = entry.data[day] || [];
        slots.forEach((slot, idx) => {
          if (slot && subjectNames.includes(slot.subject)) {
            timetable[day][idx] = {
              ...slot,
              department: subjectDeptMap[slot.subject] || 'N/A'
            };
          }
        });
      });
    });

    res.json({ timetable });
  } catch (err) {
    console.error('❌ Error fetching faculty timetable:', err);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// ✅ Update faculty
router.put('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(faculty);
  } catch (err) {
    console.error('❌ Error updating faculty:', err);
    res.status(500).json({ error: 'Failed to update faculty' });
  }
});

// ✅ Delete faculty
router.delete('/:id', async (req, res) => {
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting faculty:', err);
    res.status(500).json({ error: 'Failed to delete faculty' });
  }
});

module.exports = router;
