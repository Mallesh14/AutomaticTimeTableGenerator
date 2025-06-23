// src/pages/AdminDashboard.js
import React from 'react';
import GenerateTimetable from './components/GenerateTimetable';
import SubjectForm from './components/SubjectForm';
import FacultyForm from './components/FacultyForm';

export default function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>

      {/* Subject and Faculty Forms */}
      <SubjectForm />
      <FacultyForm />

      {/* Timetable Generator and Viewer */}
      <GenerateTimetable />
    </div>
  );
}
