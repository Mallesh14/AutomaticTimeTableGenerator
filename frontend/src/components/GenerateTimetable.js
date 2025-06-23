import React, { useState } from 'react';
import api from '../api';
import TimetableDisplay from './TimetableDisplay';

export default function GenerateTimetable() {
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [timetable, setTimetable] = useState(null);

  const handleGenerate = async () => {
    const res = await api.get(`/timetable/${department}/${semester}`);
    setTimetable(res.data);
  };

  return (
    <div>
      <input placeholder="Department" onChange={e => setDepartment(e.target.value)} />
      <input placeholder="Semester" type="number" onChange={e => setSemester(e.target.value)} />
      <button onClick={handleGenerate}>Generate Timetable</button>
      <TimetableDisplay timetable={timetable} />
    </div>
  );
}
