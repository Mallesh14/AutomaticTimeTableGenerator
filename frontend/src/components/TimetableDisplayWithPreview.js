import React, { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from '../api';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const hours = [
  { number: 1, time: '9.10-10.05' },
  { number: 2, time: '10.05-11.00' },
  { number: 3, time: '11.15-12.10' },
  { number: 4, time: '12.10-1.00' },
  { number: 5, time: '01.45-02.40' },
  { number: 6, time: '02.40-03.35' },
  { number: 7, time: '03.35-04.30' }
];

export default function TimetableDisplayWithPreview({ timetable, department, semester, section }) {
  const tableRef = useRef();
  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);

  console.log('TimetableDisplayWithPreview received:', { timetable, department, semester, section });

  useEffect(() => {
    api.get('/faculties')
      .then(res => setFaculties(res.data))
      .catch(err => console.error('Error fetching faculties:', err));
    api.get('/subjects')
      .then(res => setSubjects(res.data))
      .catch(err => console.error('Error fetching subjects:', err));
  }, []);

  if (!timetable) {
    console.log('No timetable data provided');
    return <div className="alert alert-warning">No timetable data available</div>;
  }

  // Improved subject-faculty mapping: match by subject name, faculty, and section (if available)
  const subjectFacultyMap = {};
  for (const day of days) {
    for (const hour of hours) {
      const cell = timetable[day]?.[hour.number - 1];
      if (
        cell &&
        cell.subject !== 'Library' &&
        cell.subject !== 'Free' &&
        !subjectFacultyMap[cell.subject]
      ) {
        const matchedFaculty = faculties.find(f => f.name === cell.faculty);
        // Try to match subject by name, faculty, and section (if available)
        let matchedSubject = subjects.find(s => {
          const facultyMatch = (s.faculty?.name === cell.faculty) || (s.faculty === cell.faculty);
          const sectionMatch = section ? (s.section === section) : true;
          return s.name === cell.subject && facultyMatch && sectionMatch;
        });
        if (!matchedSubject) {
          // fallback: match by subject name and section
          matchedSubject = subjects.find(s => s.name === cell.subject && (section ? s.section === section : true));
        }
        if (!matchedSubject) {
          // fallback: just match by subject name (first match)
          matchedSubject = subjects.find(s => s.name === cell.subject);
        }
        subjectFacultyMap[cell.subject] = {
          faculty: cell.faculty,
          email: matchedFaculty?.email || 'Not Provided',
          department: matchedFaculty?.department || 'N/A',
          subjectCode: cell.subjectCode || matchedSubject?.subjectCode || 'N/A',
          section: matchedSubject?.section || section || '',
        };
      }
    }
  }

  const exportPDF = async () => {
    const element = tableRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth - 40;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Muthayammal Engineering College', pageWidth / 2, 20, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Department: ${department.toUpperCase()}${section ? ' - ' + section : ''}`, 20, 35);
    pdf.text(`Semester: ${semester}`, pageWidth - 40, 35, { align: 'right' });

    const startY = 45;
    if (imgHeight + startY > pageHeight) {
      const splitHeight = pageHeight - startY - 10;
      const totalPages = Math.ceil(imgHeight / splitHeight);
      const pageCanvas = document.createElement('canvas');
      const ctx = pageCanvas.getContext('2d');

      for (let i = 0; i < totalPages; i++) {
        const partHeight = Math.min(splitHeight, imgHeight - i * splitHeight);
        pageCanvas.width = canvas.width;
        pageCanvas.height = partHeight * (canvas.width / imgWidth);
        ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          i * splitHeight * (canvas.height / imgHeight),
          canvas.width,
          partHeight * (canvas.height / imgHeight),
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        );
        const partImg = pageCanvas.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        pdf.addImage(partImg, 'PNG', 20, startY, imgWidth, partHeight);
      }
    } else {
      pdf.addImage(imgData, 'PNG', 20, startY, imgWidth, imgHeight);
    }

    const blob = pdf.output('blob');
    const blobURL = URL.createObjectURL(blob);
    window.open(blobURL);
  };

  const exportExcel = () => {
    const data = days.map(day => {
      const row = { Day: day };
      for (let i = 0; i < hours.length; i++) {
        const cell = timetable[day]?.[i];
        row[`Hour ${i + 1}`] = cell?.subject || '';
      }
      return row;
    });

    const subjectFacultyData = Object.entries(subjectFacultyMap).map(([subject, details], idx) => ({
      'S.No': idx + 1,
      'Subject': subject,
      'Subject Code': details.subjectCode,
      'Faculty Name': details.faculty,
      'Email': details.email,
      'Department & Section': `${details.department.toUpperCase()}${details.section ? ' - ' + details.section : ''}`,
    }));

    const workbook = XLSX.utils.book_new();
    const timetableSheet = XLSX.utils.json_to_sheet(data);
    const facultySheet = XLSX.utils.json_to_sheet(subjectFacultyData);

    XLSX.utils.book_append_sheet(workbook, timetableSheet, 'Timetable');
    XLSX.utils.book_append_sheet(workbook, facultySheet, 'Faculty Details');

    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'timetable_with_faculty.xlsx');
  };

  return (
    <div className="mt-2">
      {/* Export Controls */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h6 className="mb-0 edu-text-primary fw-bold">
          <i className="fas fa-calendar-week me-2"></i>
          Weekly Schedule
        </h6>
        <div className="d-flex gap-2">
          <button 
            className="edu-button-secondary"
            onClick={exportPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '0.875rem',
              border: 'none'
            }}
          >
            <i className="fas fa-file-pdf"></i>
            Export PDF
          </button>
          <button 
            className="edu-button-primary"
            onClick={exportExcel}
            style={{
              display: 'flex',
              alignItems: 'center',  
              gap: '8px',
              padding: '10px 20px',
              fontSize: '0.875rem',
              border: 'none'
            }}
          >
            <i className="fas fa-file-excel"></i>
            Export Excel
          </button>
        </div>
      </div>

      <div ref={tableRef} className="edu-card p-4">
        {/* Timetable Table */}
        <table className="edu-table w-100">
          <thead>
            <tr>
              <th style={{width: '100px'}}>Day</th>
              {hours.map(hour => (
                <th key={hour.number}>
                  <div className="fw-bold">Hour {hour.number}</div>
                  <small className="text-white-50">{hour.time}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={day}>
                <td className="fw-bold edu-text-primary">{day}</td>
                {hours.map(hour => {
                  const cell = timetable[day]?.[hour.number - 1];
                  return (
                    <td key={hour.number} className={cell?.isLab ? 'bg-warning bg-opacity-25' : ''}>
                      {cell ? (
                        <div className="p-2">
                          <div className="fw-bold edu-text-primary" style={{fontSize: '0.9rem'}}>
                            {cell.subject}
                          </div>
                          <small className="edu-text-gray d-block mt-1">
                            {cell.faculty}
                          </small>
                        </div>
                      ) : (
                        <div className="text-muted p-2">
                          <i className="fas fa-circle" style={{fontSize: '6px', opacity: 0.3}}></i>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Subject–Faculty Table */}
        <h5 className="mt-4">Subject – Faculty Details</h5>
        <table className="table table-bordered table-striped">
          <thead className="table-secondary">
            <tr>
              <th>S.No</th>
              <th>Subject</th>
              <th>Subject Code</th>
              <th>Faculty Name</th>
              <th>Email</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(subjectFacultyMap).map(([subject, details], idx) => (
              <tr key={subject}>
                <td>{idx + 1}</td>
                <td>{subject}</td>
                <td>{details.subjectCode}</td>
                <td>{details.faculty}</td>
                <td>{details.email}</td>
                <td>{`${details.department.toUpperCase()}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
