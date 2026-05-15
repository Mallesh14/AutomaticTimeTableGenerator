const express = require('express');
const router = express.Router();
const generateTimetable = require('../utils/timetableGenerator');
const Timetable = require('../models/Timetable');
const Faculty = require('../models/Faculty');

// ✅ Check if timetable exists for department/semester/section
router.get('/check/:department/:semester', async (req, res) => {
  const { department, semester } = req.params;
  const { section } = req.query;

  try {
    const timetableQuery = { department, semester: Number(semester) };
    if (section) timetableQuery.section = section;
    
    const existing = await Timetable.findOne(timetableQuery);
    
    if (existing) {
      console.log('📦 Found existing timetable in DB');
      return res.json({
        exists: true,
        timetable: existing.data
      });
    } else {
      console.log('📭 No existing timetable found');
      return res.json({
        exists: false
      });
    }
  } catch (err) {
    console.error('❌ Error checking timetable:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ 1. Get specific timetable by department and semester (generate if missing)
router.get('/:department/:semester', async (req, res) => {
  const { department, semester } = req.params;
  const { section } = req.query;

  try {
    // Check if timetable already exists (with section if provided)
    const timetableQuery = { department, semester: Number(semester) };
    if (section) timetableQuery.section = section;
    const existing = await Timetable.findOne(timetableQuery);
    if (existing) {
      console.log('📦 Returning saved timetable from DB');
      return res.json(existing.data);
    }

    // Generate timetable if not found
    const result = await generateTimetable(department, Number(semester), section);

    if (!result.success) {
      console.log('Timetable generation failed');
      return res.status(400).json({
        error: result.message || 'Unable to generate timetable',
        totalTheoryHours: result.totalTheoryHours,
        totalLabHours: result.totalLabHours,
        combinedHours: result.combinedHours,
      });
    }

    // Save generated timetable to DB (with section if provided)
    const timetableDoc = {
      department,
      semester: Number(semester),
      data: result.timetable,
    };
    if (section) timetableDoc.section = section;
    await Timetable.create(timetableDoc);

    console.log('Timetable generated and saved to DB');
    res.json(result.timetable);

  } catch (err) {
    console.error('❌ Error generating timetable:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ 2. Get all generated timetables (for admin view)
router.get('/', async (req, res) => {
  try {
    const all = await Timetable.find({}); // Get full timetable data including the data field
    res.json(all);
  } catch (err) {
    console.error('❌ Error fetching timetables:', err.message);
    res.status(500).json({ error: 'Failed to fetch timetables' });
  }
});

// ✅ 3. Delete timetable by ID and restore faculty availability
router.delete('/:id', async (req, res) => {
  try {
    const timetableDoc = await Timetable.findById(req.params.id);
    if (!timetableDoc) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    const { data: timetable } = timetableDoc;

    // Step 1: Collect occupied slots by facultyEmail
    const slotsToRestore = {};

    for (const day in timetable) {
      const periods = timetable[day];
      periods.forEach((slot, index) => {
        if (slot?.facultyEmail) {
          const slotStr = `${day.slice(0, 3)}-${index + 1}`;
          if (!slotsToRestore[slot.facultyEmail]) {
            slotsToRestore[slot.facultyEmail] = [];
          }
          slotsToRestore[slot.facultyEmail].push(slotStr);
        }
      });
    }

    // Step 2: Update each faculty’s availableSlots
    await Promise.all(
      Object.entries(slotsToRestore).map(async ([email, slots]) => {
        const faculty = await Faculty.findOne({ email });
        if (faculty) {
          const updatedSet = new Set([...faculty.availableSlots, ...slots]);
          faculty.availableSlots = Array.from(updatedSet);
          // Ensure facultyId is present to avoid validation error
          if (!faculty.facultyId) {
            faculty.facultyId = faculty.email || `faculty_${faculty._id}`;
          }
          await faculty.save();
        }
      })
    );

    // Step 3: Delete the timetable document
    await timetableDoc.deleteOne();

    res.json({ success: true, message: '🗑️ Timetable deleted and faculty availability restored.' });
  } catch (err) {
    console.error('❌ Error deleting timetable:', err.message);
    res.status(500).json({ error: 'Failed to delete timetable' });
  }
});

// timetableRoutes.js or appropriate router
router.get('/student/timetable/:department/:semester', async (req, res) => {
  const { department, semester } = req.params;
  const { section } = req.query;

  try {
    // Build query with optional section
    const timetableQuery = { department, semester: Number(semester) };
    if (section) timetableQuery.section = section;
    
    const timetable = await Timetable.findOne(timetableQuery);
    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found for this department and semester' });
    }
    res.json(timetable.data);
  } catch (err) {
    console.error('❌ Error fetching student timetable:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
