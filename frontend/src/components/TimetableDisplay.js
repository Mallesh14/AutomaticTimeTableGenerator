// import React, { useRef, useState, useEffect } from 'react';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import api from '../api';

// const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
// const hours = [1, 2, 3, 4, 5, 6, 7];

// export default function TimetableDisplay({ timetable, department, semester }) {
//   const tableRef = useRef();
//   const [faculties, setFaculties] = useState([]);

//   useEffect(() => {
//     api.get('/faculties')
//       .then(res => setFaculties(res.data))
//       .catch(err => console.error('Error fetching faculties:', err));
//   }, []);

//   if (!timetable) return null;

//   // Create subject-faculty mapping excluding Library and Free, and include subjectCode
//   const subjectFacultyMap = {};
//   for (const day of days) {
//     for (const hour of hours) {
//       const cell = timetable[day]?.[hour - 1];
//       if (
//         cell &&
//         cell.subject !== 'Library' &&
//         cell.subject !== 'Free' &&
//         !subjectFacultyMap[cell.subject]
//       ) {
//         const matchedFaculty = faculties.find(f => f.name === cell.faculty);
//         subjectFacultyMap[cell.subject] = {
//           faculty: cell.faculty,
//           email: matchedFaculty?.email || 'Not Provided',
//           department: matchedFaculty?.department || 'N/A',
//           subjectCode: cell.subjectCode || '',
//         };
//       }
//     }
//   }

//   const exportPDF = async () => {
//     const element = tableRef.current;
//     const canvas = await html2canvas(element, { scale: 2, useCORS: true });
//     const imgData = canvas.toDataURL('image/png');
//     const pdf = new jsPDF('p', 'mm', 'a4');

//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();
//     const imgProps = pdf.getImageProperties(imgData);
//     const imgWidth = pageWidth - 40;
//     const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

//     pdf.setFontSize(16);
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Muthayammal Engineering College', pageWidth / 2, 20, { align: 'center' });

//     pdf.setFontSize(12);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(`Department: ${department.toUpperCase()}`, 20, 35);
//     pdf.text(`Semester: ${semester}`, pageWidth - 40, 35, { align: 'right' });

//     const startY = 45;
//     if (imgHeight + startY > pageHeight) {
//       const splitHeight = pageHeight - startY - 10;
//       const totalPages = Math.ceil(imgHeight / splitHeight);
//       const pageCanvas = document.createElement('canvas');
//       const ctx = pageCanvas.getContext('2d');

//       for (let i = 0; i < totalPages; i++) {
//         const partHeight = Math.min(splitHeight, imgHeight - i * splitHeight);
//         pageCanvas.width = canvas.width;
//         pageCanvas.height = partHeight * (canvas.width / imgWidth);
//         ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
//         ctx.drawImage(
//           canvas,
//           0,
//           i * splitHeight * (canvas.height / imgHeight),
//           canvas.width,
//           partHeight * (canvas.height / imgHeight),
//           0,
//           0,
//           pageCanvas.width,
//           pageCanvas.height
//         );
//         const partImg = pageCanvas.toDataURL('image/png');
//         if (i > 0) pdf.addPage();
//         pdf.addImage(partImg, 'PNG', 20, startY, imgWidth, partHeight);
//       }
//     } else {
//       pdf.addImage(imgData, 'PNG', 20, startY, imgWidth, imgHeight);
//     }

//     const blob = pdf.output('blob');
//     const blobURL = URL.createObjectURL(blob);
//     window.open(blobURL);
//   };

//   const exportExcel = () => {
//     const data = days.map(day => {
//       const row = { Day: day };
//       for (let i = 0; i < hours.length; i++) {
//         const cell = timetable[day]?.[i];
//         row[`Hour ${i + 1}`] = cell?.subject || '';
//       }
//       return row;
//     });

//     const subjectFacultyData = Object.entries(subjectFacultyMap).map(([subject, details], idx) => ({
//       'S.No': idx + 1,
//       'Subject': subject,
//       'Subject Code': details.subjectCode,
//       'Faculty Name': details.faculty,
//       'Email': details.email,
//       'Department': details.department.toUpperCase(),
//     }));

//     const workbook = XLSX.utils.book_new();
//     const timetableSheet = XLSX.utils.json_to_sheet(data);
//     const facultySheet = XLSX.utils.json_to_sheet(subjectFacultyData);

//     XLSX.utils.book_append_sheet(workbook, timetableSheet, 'Timetable');
//     XLSX.utils.book_append_sheet(workbook, facultySheet, 'Faculty Details');

//     const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
//     saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'timetable_with_faculty.xlsx');
//   };

//   return (
//     <div className="mt-4">
//       <h4>📅 Generated Timetable</h4>

//       <div className="mb-3 d-flex gap-2 flex-wrap">
//         <button className="btn btn-outline-primary" onClick={exportPDF}>📄 Download PDF</button>
//         <button className="btn btn-outline-success" onClick={exportExcel}>📊 Download Excel</button>
//       </div>

//       <div ref={tableRef} className="bg-white p-3 rounded shadow-sm">
//         {/* Timetable Table */}
//         <table className="table table-bordered text-center align-middle table-hover">
//           <thead className="table-light sticky-top">
//             <tr>
//               <th>Day</th>
//               {hours.map(hour => (
//                 <th key={hour}>Hour {hour}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {days.map(day => (
//               <tr key={day}>
//                 <td className="fw-bold">{day}</td>
//                 {hours.map(hour => {
//                   const cell = timetable[day]?.[hour - 1];
//                   return (
//                     <td key={hour} className={cell?.isLab ? 'bg-warning' : ''}>
//                       {cell ? (
//                         <div>
//                           <strong>{cell.subject}</strong>
//                           {cell.subjectCode && (
//                             <div className="small text-muted">
//                               {cell.subjectCode}
//                             </div>
//                           )}
//                         </div>
//                       ) : (
//                         <em>--</em>
//                       )}
//                     </td>
//                   );
//                 })}
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {/* Subject–Faculty Table */}
//         <h5 className="mt-4">🧑‍🏫 Subject – Faculty Details</h5>
//         <table className="table table-bordered table-striped">
//           <thead className="table-secondary">
//             <tr>
//               <th>S.No</th>
//               <th>Subject</th>
//               <th>Subject Code</th>
//               <th>Faculty Name</th>
//               <th>Email</th>
//               <th>Department</th>
//             </tr>
//           </thead>
//           <tbody>
//             {Object.entries(subjectFacultyMap).map(([subject, details], idx) => (
//               <tr key={subject}>
//                 <td>{idx + 1}</td>
//                 <td>{subject}</td>
//                 <td>{details.subjectCode}</td>
//                 <td>{details.faculty}</td>
//                 <td>{details.email}</td>
//                 <td>{details.department.toUpperCase()}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
