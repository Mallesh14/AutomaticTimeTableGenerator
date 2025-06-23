import React, { useState } from 'react';
import api from '../api';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const hours = [1, 2, 3, 4, 5, 6, 7];
const allSlots = days.flatMap(day => hours.map(hour => `${day}-${hour}`));

export default function FacultyForm() {
  const [form, setForm] = useState({ name: '', availableSlots: [] });
  const [selectAll, setSelectAll] = useState(false);

  const handleCheckboxChange = (slot) => {
    const updated = form.availableSlots.includes(slot)
      ? form.availableSlots.filter(s => s !== slot)
      : [...form.availableSlots, slot];
    setForm({ ...form, availableSlots: updated });
  };

  const handleSelectAll = () => {
    const isAll = !selectAll;
    setSelectAll(isAll);
    setForm({ ...form, availableSlots: isAll ? allSlots : [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Faculty name is required.');
    try {
      await api.post('/faculties', form);
      alert('Faculty added');
      setForm({ name: '', availableSlots: [] });
      setSelectAll(false);
    } catch (err) {
      console.error('Error adding faculty:', err);
      alert('Failed to add faculty');
    }
  };

  return (
    <div style={{ maxWidth: '400px', marginBottom: '20px' }}>
      <h3>Add Faculty</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Faculty Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />

        <label style={{ display: 'block', marginBottom: '10px' }}>
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAll}
          />
          &nbsp;Fully Available (All Slots)
        </label>

        <div style={{
          maxHeight: '180px',
          overflowY: 'scroll',
          border: '1px solid #ccc',
          padding: '8px',
          marginBottom: '10px'
        }}>
          {allSlots.map(slot => (
            <label key={slot} style={{ display: 'block', marginBottom: '4px' }}>
              <input
                type="checkbox"
                checked={form.availableSlots.includes(slot)}
                onChange={() => handleCheckboxChange(slot)}
              />
              &nbsp;{slot}
            </label>
          ))}
        </div>

        <button type="submit" style={{ padding: '8px 12px' }}>
          Add Faculty
        </button>
      </form>
    </div>
  );
}
