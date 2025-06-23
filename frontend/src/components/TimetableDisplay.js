import React from 'react';

export default function TimetableDisplay({ timetable }) {
  if (!timetable) return <p>No timetable generated yet.</p>;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <table border="1" cellPadding="10">
      <thead>
        <tr>
          <th>Day / Hour</th>
          {[...Array(7)].map((_, i) => <th key={i}>Hour {i + 1}</th>)}
        </tr>
      </thead>
      <tbody>
        {days.map(day => (
          <tr key={day}>
            <td><b>{day}</b></td>
            {timetable[day].map((slot, idx) => (
              <td key={idx}>
                {slot ? (
                  <>
                    <b>{slot.subject}</b><br />
                    <i>{slot.faculty}</i><br />
                    {slot.isLab ? '🧪 Lab' : '📖 Theory'}
                  </>
                ) : '—'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
