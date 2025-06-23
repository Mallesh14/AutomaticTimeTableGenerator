import React from 'react';
import FacultyForm from '../components/FacultyForm';
import SubjectForm from '../components/SubjectForm';
import GenerateTimetable from '../components/GenerateTimetable';
// ...
<GenerateTimetable />

export default function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <FacultyForm />
      <hr />
      <SubjectForm />
      <hr />
        <GenerateTimetable />
    </div>
  );
}
