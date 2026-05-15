const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const hoursPerDay = 7;
const MAX_RECURSIONS = 20000;
let recursionCount = 0;

function slotKey(day, hour) {
  return `${day}-${hour + 1}`;
}

function isAvailable(facultySlots, day, hour) {
  return facultySlots.includes(slotKey(day, hour));
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initState(subjects) {
  const timetable = {};
  const subjectHours = {};
  const subjectCountMap = {};

  days.forEach(day => {
    timetable[day] = Array(hoursPerDay).fill(null);
    subjectCountMap[day] = {};
  });

  subjects.forEach(s => {
    subjectHours[s.name] = s.weeklyHours;
  });

  return { timetable, subjectHours, subjectCountMap };
}

function canPlaceTheory(subject, timetable, day, hour, subjectCountMap) {
  if (timetable[day][hour] !== null) return false;
  if (!isAvailable(subject.faculty.availableSlots, day, hour)) return false;

  const subjectCountToday = subjectCountMap[day][subject.name] || 0;
  const repeatedSubjects = Object.values(subjectCountMap[day]).filter(c => c > 1).length;

  if (subjectCountToday >= 2) return false;
  if (subjectCountToday === 1 && repeatedSubjects >= 1) return false;

  return true;
}

function canPlaceLab(subject, timetable, day, hour) {
  if (hour > hoursPerDay - 3) return false;

  const slots = [0, 1, 2].map(i => hour + i);
  const slotKeys = slots.map(h => slotKey(day, h));
  const allAvailable = slotKeys.every(k => subject.faculty.availableSlots.includes(k));
  const allFree = slots.every(h => timetable[day][h] === null);

  const labCount = timetable[day].filter(s => s?.isLab).length;

  return allAvailable && allFree && labCount < 1;
}

function place(subjects, state, index) {
  if (++recursionCount > MAX_RECURSIONS) {
    console.log('🛑 Max recursion reached');
    return false;
  }

  if (Date.now() - globalStartTime > 5000) {
    console.log('⏰ Timeout: Stopping recursion after 5 seconds');
    return false;
  }

  if (index >= subjects.length) return true;

  const subject = subjects[index];
  const isLab = subject.isLab;

  const randomizedDays = shuffle(days);

  for (const day of randomizedDays) {
    const randomizedHours = shuffle([...Array(hoursPerDay).keys()]);
    for (const hour of randomizedHours) {
      if (isLab) {
        if (canPlaceLab(subject, state.timetable, day, hour)) {
          for (let i = 0; i < 3; i++) {
            state.timetable[day][hour + i] = {
              subject: subject.name,
              subjectCode: subject.subjectCode,
              faculty: subject.faculty.name,
              facultyEmail: subject.faculty.email,
              isLab: true
            };
          }
          state.subjectHours[subject.name] -= 3;

          if (place(subjects, state, index + 1)) return true;

          for (let i = 0; i < 3; i++) {
            state.timetable[day][hour + i] = null;
          }
          state.subjectHours[subject.name] += 3;
        }
      } else {
        if (canPlaceTheory(subject, state.timetable, day, hour, state.subjectCountMap)) {
          state.timetable[day][hour] = {
            subject: subject.name,
            subjectCode: subject.subjectCode,
            faculty: subject.faculty.name,
            facultyEmail: subject.faculty.email,
            isLab: false
          };
          state.subjectHours[subject.name]--;
          state.subjectCountMap[day][subject.name] = (state.subjectCountMap[day][subject.name] || 0) + 1;

          if (state.subjectHours[subject.name] === 0) {
            if (place(subjects, state, index + 1)) return true;
          } else {
            if (place(subjects, state, index)) return true;
          }

          state.timetable[day][hour] = null;
          state.subjectHours[subject.name]++;
          state.subjectCountMap[day][subject.name]--;
        }
      }
    }
  }

  return false;
}


// Accepts optional section argument
async function generateTimetable(dept, semester, section) {
  const subjectQuery = { department: dept, semester };
  if (section) subjectQuery.section = section;
  const subjects = await Subject.find(subjectQuery).populate('faculty');

  const totalTheory = subjects.filter(s => !s.isLab).reduce((sum, s) => sum + s.weeklyHours, 0);
  const totalLabs = subjects.filter(s => s.isLab).reduce((sum, s) => sum + s.weeklyHours, 0);
  const combined = totalTheory + totalLabs;

  console.log(`🧮 Total theory: ${totalTheory} hrs, Labs: ${totalLabs} hrs, Combined: ${combined}`);

  // 🚨 Early return if total required hours exceed available slots
const totalAvailableSlots = days.length * hoursPerDay; // 5 * 7 = 35
if (combined > totalAvailableSlots) {
  return {
    success: false,
    message: 'Total required hours exceed available weekly periods.',
    totalTheoryHours: totalTheory,
    totalLabHours: totalLabs,
    combinedHours: combined,
    maxAllowed: totalAvailableSlots
  };
}

  subjects.forEach(s => {
    console.log(`${s.name} (${s.weeklyHours}h) by ${s.faculty.name} – Available Slots: ${s.faculty.availableSlots.length}`);
  });

  subjects.sort((a, b) => {
    if (a.isLab !== b.isLab) return b.isLab - a.isLab;
    if (b.weeklyHours !== a.weeklyHours) return b.weeklyHours - a.weeklyHours;
    return a.faculty.availableSlots.length - b.faculty.availableSlots.length;
  });

  for (let attempt = 1; attempt <= 20; attempt++) {
    recursionCount = 0;
    global.globalStartTime = Date.now();

    console.log(`\n🔁 Attempt #${attempt} with shuffled subject order`);
    const shuffled = shuffle(subjects);
    const state = initState(subjects);
    const success = place(shuffled, state, 0);

    if (success) {
      console.log(`Timetable successfully generated on attempt #${attempt}`);

      // Update faculty availability
      const updatedFacultyAvailability = {};

      for (const day of days) {
        for (let hour = 0; hour < hoursPerDay; hour++) {
          const cell = state.timetable[day][hour];
          if (cell) {
            const slot = `${day}-${hour + 1}`;
            const facultyEmail = cell.facultyEmail;
            if (!updatedFacultyAvailability[facultyEmail]) {
              updatedFacultyAvailability[facultyEmail] = new Set();
            }
            updatedFacultyAvailability[facultyEmail].add(slot);
          }
        }
      }

      for (const [facultyEmail, slotsSet] of Object.entries(updatedFacultyAvailability)) {
        const facultyDoc = await Faculty.findOne({ email: facultyEmail });
        if (facultyDoc) {
          facultyDoc.availableSlots = facultyDoc.availableSlots.filter(
            slot => !slotsSet.has(slot)
          );
          await facultyDoc.save();
        }
      }

      // Assign 1 Library hour
      let freeSlots = [];
      for (const day of days) {
        for (let hour = 0; hour < hoursPerDay; hour++) {
          if (!state.timetable[day][hour]) {
            freeSlots.push({ day, hour });
          }
        }
      }

      if (freeSlots.length > 0) {
        const shuffledFree = shuffle(freeSlots);
        const librarySlot = shuffledFree[0];
        state.timetable[librarySlot.day][librarySlot.hour] = {
          subject: 'Library',
          faculty: '-',
          isLab: false
        };
      }

      return {
        success: true,
        timetable: state.timetable
      };
    }
  }

  console.log('Unable to generate a valid timetable for all subjects.');
  return {
    success: false,
    message: 'Unable to generate a valid timetable for all subjects.',
    totalTheoryHours: totalTheory,
    totalLabHours: totalLabs,
    combinedHours: combined
  };
}

module.exports = generateTimetable;