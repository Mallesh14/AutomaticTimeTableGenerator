import React, { useState, useEffect } from 'react';
import api from '../api';

export default function SubjectForm() {
  const [faculties, setFaculties] = useState([]);
  const [form, setForm] = useState({
    name: '',
    department: '',
    semester: '',
    weeklyHours: '',
    isLab: false,
    faculty: ''
  });

  useEffect(() => {
    api.get('/faculties')
      .then(res => {
        setFaculties(res.data);
      })
      .catch(err => {
        console.error("Failed to load faculties:", err);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subjects', form);
      alert('Subject added');
    } catch (err) {
      console.error('Error adding subject:', err);
      alert('Failed to add subject');
    }
  };

  return (
    <div>
      <h3>Add Subject</h3>
      <form onSubmit={handleSubmit}>
        <input placeholder="Subject Name" onChange={e => setForm({...form, name: e.target.value})} />
        <input placeholder="Department" onChange={e => setForm({...form, department: e.target.value})} />
        <input type="number" placeholder="Semester" onChange={e => setForm({...form, semester: e.target.value})} />
        <input type="number" placeholder="Weekly Hours" onChange={e => setForm({...form, weeklyHours: e.target.value})} />
        
        <label>
          <input
            type="checkbox"
            onChange={e => setForm({ ...form, isLab: e.target.checked })}
          />
          Is Lab
        </label>

        <select onChange={e => setForm({ ...form, faculty: e.target.value })}>
          <option>Select Faculty</option>
          {faculties.map(fac => (
            <option key={fac._id} value={fac._id}>
              {fac.name}
            </option>
          ))}
        </select>

        <button type="submit">Add Subject</button>
      </form>
    </div>
  );
}
