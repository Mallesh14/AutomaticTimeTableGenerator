const express = require('express');
const router = express.Router();
const generateTimetable = require('../utils/timetableGenerator');
const Timetable = require('../models/Timetable');

router.get('/:department/:semester', async (req, res) => {
  const { department, semester } = req.params;

  try {
    // 1. Check DB first
    const existing = await Timetable.findOne({ department, semester: Number(semester) });
    if (existing) {
      console.log('📦 Returning saved timetable from DB');
      return res.json(existing.data);
    }

    // 2. Generate if not found
    const generated = await generateTimetable(department, Number(semester));
    if (!generated) {
      return res.status(400).json({ error: 'Unable to generate timetable' });
    }

    // 3. Save and return
    await Timetable.create({
      department,
      semester: Number(semester),
      data: generated,
    });

    console.log('✅ Timetable generated and saved to DB');
    res.json(generated);

  } catch (err) {
    console.error('❌ Error generating timetable:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
