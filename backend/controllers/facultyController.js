const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const User = require('../models/User');
// Create a new faculty with name, department, and available time slots
// exports.createFaculty = async (req, res) => {
//   try {
//     const { name, department, availableSlots } = req.body;

//     // Basic validation
//     if (!name || !department || !Array.isArray(availableSlots)) {
//       return res.status(400).json({ error: 'Name, department, and availableSlots (array) are required.' });
//     }

//     // Flatten slots in case of nested array
//     const flatSlots = availableSlots.flat();

//     // Prevent duplicate names (case-insensitive)
//     const existing = await Faculty.findOne({ name: new RegExp(`^${name}$`, 'i') });
//     if (existing) {
//       return res.status(409).json({ error: 'Faculty with this name already exists.' });
//     }

//     // Create faculty
//     const faculty = await Faculty.create({
//       name,
//       department,
//       availableSlots: flatSlots,
//     });

//     console.log('✅ Faculty created:', faculty.name);
//     res.status(201).json(faculty);
//   } catch (err) {
//     console.error('❌ Error creating faculty:', err);
//     res.status(500).json({ error: err.message });
//   }
// };
exports.createFaculty = async (req, res) => {
  try {
    const { facultyId, name, email, department, availableSlots } = req.body;

    if (!facultyId || !name || !email || !department || !Array.isArray(availableSlots)) {
      return res.status(400).json({ error: 'Faculty ID, name, email, department, and availableSlots are required.' });
    }

    const flatSlots = availableSlots.flat();

    // Check for duplicate email or facultyId
    const existingFaculty = await Faculty.findOne({ $or: [
      { email: new RegExp(`^${email}$`, 'i') },
      { facultyId: new RegExp(`^${facultyId}$`, 'i') }
    ] });
    if (existingFaculty) {
      return res.status(409).json({ error: 'Faculty with this email or ID already exists.' });
    }

    // Create Faculty
    const faculty = await Faculty.create({
      facultyId,
      name,
      email,
      department,
      availableSlots: flatSlots,
    });

    // Create User for faculty login
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(facultyId, 10);
    const userExists = await User.findOne({ email });
    if (!userExists) {
      await User.create({
        username: name,
        email,
        password: hashedPassword,
        role: 'faculty',
        department,
        facultyRef: faculty._id
      });
    }

    console.log('Faculty and user created:', faculty.name);
    res.status(201).json(faculty);
  } catch (err) {
    console.error('❌ Error creating faculty:', err);
    res.status(500).json({ error: err.message });
  }
}

// Get all faculties
exports.getAllFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find();
    res.json(faculties);
  } catch (err) {
    console.error('❌ Error fetching faculties:', err);
    res.status(500).json({ error: err.message });
  }
};

// exports.getFacultyDashboard = async (req, res) => {
//   try {
//     const userEmail = req.user?.email; // from token via middleware
//     if (!userEmail) return res.status(403).json({ error: 'Unauthorized' });

//     // Find faculty by email (assuming stored during registration)
//     const faculty = await Faculty.findOne({ email: userEmail });
//     if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

//     // Find all subjects handled by this faculty
//     const subjects = await Subject.find({ faculty: faculty.name });

//     // Fetch timetable if it exists for their department/semester
//     let timetable = null;
//     if (subjects.length > 0) {
//       const { department, semester } = subjects[0];
//       timetable = await Timetable.findOne({ department, semester });
//     }

//     res.json({ faculty, subjects, timetable });
//   } catch (err) {
//     console.error('❌ Error in faculty dashboard:', err);
//     res.status(500).json({ error: err.message });
//   }
// };
// exports.getFacultyDashboard = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).populate('facultyRef');
    
//     if (!user || user.role !== 'faculty' || !user.facultyRef) {
//       return res.status(403).json({ error: 'Unauthorized or unlinked faculty account' });
//     }

//     const subjects = await Subject.find({ faculty: user.facultyRef._id });

//     res.json({
//       faculty: user.facultyRef,
//       subjects
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Error fetching faculty dashboard' });
//   }
// };
exports.getFacultyDashboard = async (req, res) => {
  try {
    // Get logged-in user with facultyRef populated
    const user = await User.findById(req.user.id).populate('facultyRef');
    if (!user || user.role !== 'faculty' || !user.facultyRef) {
      return res.status(403).json({ error: 'Unauthorized or unlinked faculty account' });
    }

    const faculty = user.facultyRef;

    // Get subjects handled by this faculty
    const subjects = await Subject.find({ faculty: faculty._id });

    const totalHours = subjects.reduce((sum, sub) => sum + (sub.weeklyHours || 0), 0);

    // 🧠 Determine department/semester from subjects (if available)
    const firstSubject = subjects[0];
    let timetable = null;

    if (firstSubject) {
      const { department, semester } = firstSubject;

      // Get department timetable
      const timetableDoc = await Timetable.findOne({ department, semester });

      if (timetableDoc && timetableDoc.data) {
        // Filter timetable to only show slots for this faculty
        timetable = timetableDoc.data.map(day =>
          day.map(slot => {
            if (slot && slot.facultyEmail === faculty.email) {
              return slot;
            } else {
              return null; // Empty cell for others
            }
          })
        );
      }
    }

    res.json({
      facultyName: faculty.name,
      facultyEmail: faculty.email,
      department: faculty.department,
      totalHours,
      subjects,
      timetable // ✅ Always return a filtered timetable
    });

  } catch (err) {
    console.error('❌ Faculty dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};