import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [editingSubject, setEditingSubject] = useState(null);
  const [filterDept, setFilterDept] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastTimeout = useRef(null);

  const [form, setForm] = useState({
    subjectCode: '',
    name: '',
    department: '',
    section: 'A',
    semester: '',
    weeklyHours: '',
    isLab: false,
    faculty: ''
  });

  useEffect(() => {
    fetchSubjects();
    fetchFaculties();
  }, []);

  const fetchSubjects = async () => {
    const res = await api.get('/subjects');
    setSubjects(res.data);
  };

  const fetchFaculties = async () => {
    const res = await api.get('/faculties');
    setFaculties(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject._id}`, form);
        setToast({ show: true, message: '✅ Subject updated', type: 'success' });
        setEditingSubject(null);
      } else {
        await api.post('/subjects', form);
        setToast({ show: true, message: '✅ Subject added', type: 'success' });
      }

      // Reset form
      setForm({
        subjectCode: '',
        name: '',
        department: '',
        section: 'A',
        semester: '',
        weeklyHours: '',
        isLab: false,
        faculty: ''
      });
      fetchSubjects();
    } catch (err) {
      console.error('Error saving subject:', err);
      setToast({ show: true, message: 'Error occurred while saving', type: 'danger' });
    }
  };

  // Hide toast after 2.5s
  useEffect(() => {
    if (toast.show) {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => {
        setToast(t => ({ ...t, show: false }));
      }, 2500);
    }
    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, [toast.show]);

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setForm({
      subjectCode: subject.subjectCode || '',
      name: subject.name || '',
      department: subject.department || '',
      section: subject.section || '',
      semester: subject.semester || '',
      weeklyHours: subject.weeklyHours || '',
      isLab: subject.isLab || false,
      faculty: subject.faculty?._id || subject.faculty || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this subject?')) {
      await api.delete(`/subjects/${id}`);
      fetchSubjects();
    }
  };

  const cancelEdit = () => {
    setEditingSubject(null);
    setForm({
      subjectCode: '',
      name: '',
      department: '',
      section: 'A',
      semester: '',
      weeklyHours: '',
      isLab: false,
      faculty: ''
    });
  };

  // Unique departments for summary table
  const uniqueDepartments = Array.from(
    new Set(subjects.map(s => s.department).filter(Boolean))
  );

  // State for expanded department
  const [expandedDept, setExpandedDept] = useState(null);

  // Subjects for expanded department
  const subjectsByDept = dept => subjects.filter(s => s.department === dept);

  const filteredSubjects = filterDept
    ? subjects.filter(s => (s.department || '').toLowerCase().includes(filterDept.toLowerCase()))
    : subjects;

  return (
    <div className="container mt-4" style={{
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px',
      padding: '20px'
    }}>
      {/* Toast Notification */}
      <div
        className={`toast position-fixed top-0 end-0 m-3 ${toast.show ? 'show' : ''}`}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={{ zIndex: 9999, minWidth: 250 }}
      >
        <div className={`toast-header bg-${toast.type} text-white`}>
          <strong className="me-auto">{toast.type === 'success' ? 'Success' : 'Error'}</strong>
          <button type="button" className="btn-close btn-close-white ms-2 mb-1" aria-label="Close" onClick={() => setToast(t => ({ ...t, show: false }))}></button>
        </div>
        <div className="toast-body">{toast.message}</div>
      </div>

      {/* Form */}
      <div className="card p-4 shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%)',
        borderRadius: '15px',
        border: '1px solid rgba(33, 150, 243, 0.1)'
      }}>
        <h4>{editingSubject ? '✏ Edit Subject' : 'Add Subject'}</h4>
        <form onSubmit={handleSubmit}>
          <input className="form-control mb-2" placeholder="Subject Code" value={form.subjectCode} onChange={e => setForm({ ...form, subjectCode: e.target.value })} required />
          <input className="form-control mb-2" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <div className="col-md-4 mb-2">
            <select
              className="form-select"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              required
            >
              <option value="">Select Department</option>
              <option value="CSE">Computer Science and Engineering (CSE)</option>
              <option value="IT">Information Technology (IT)</option>
              <option value="ECE">Electronics and Communication Engineering (ECE)</option>
              <option value="EEE">Electrical and Electronics Engineering (EEE)</option>
              <option value="MECH">Mechanical Engineering (MECH)</option>
              <option value="CIVIL">Civil Engineering</option>
              <option value="AIDS">Artificial Intelligence and Data Science (AIDS)</option>
              <option value="AIML">Artificial Intelligence and Machine Learning (AIML)</option>
              <option value="CSBS">Computer Science and Business Systems (CSBS)</option>
              <option value="CSE(CS)">CSE-Cyber Security (CSE-CS)</option>
              <option value="BIOTECH">Biotechnology</option>
              <option value="BIOMED">Biomedical Engineering</option>
              <option value="S&H">Science and Humanities (S&H)</option>
              <option value="MBA">Master of Business Administration (MBA)</option>
              <option value="MCA">Master of Computer Applications (MCA)</option>
              <option value="MATHS">Mathematics (Maths)</option>
            </select>
          </div>
          <div className="col-md-4 mb-2">
            <select
              className="form-select"
              value={form.section}
              onChange={e => setForm({ ...form, section: e.target.value === '--' ? '-' : e.target.value })}
              required
            >
              <option value="">Select Section</option>
              <option value="--">-</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          {/* <input className="form-control mb-2" placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required /> */}
          <input className="form-control mb-2" type="number" placeholder="Semester" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} required />
          <input className="form-control mb-2" type="number" placeholder="Weekly Hours" value={form.weeklyHours} onChange={e => setForm({ ...form, weeklyHours: e.target.value })} required />
          <div className="form-check mb-2">
            <input className="form-check-input" type="checkbox" checked={form.isLab} onChange={e => setForm({ ...form, isLab: e.target.checked })} />
            <label className="form-check-label">Is Lab</label>
          </div>
          <select className="form-select mb-3" value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })} required>
            <option value="">Select Faculty</option>
            {faculties.map(f => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </select>
          <div className="d-flex justify-content-between">
            <button className="btn btn-primary" type="submit">
              {editingSubject ? 'Update Subject' : 'Add Subject'}
            </button>
            {editingSubject && (
              <button className="btn btn-secondary" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Department Summary Table */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">Departments</h5>
        </div>
        <div className="card-body p-0">
          {uniqueDepartments.length === 0 ? (
            <p className="text-muted p-3">No departments found.</p>
          ) : (
            <table className="table table-bordered table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '60px' }}>S. No</th>
                  <th>Department Name</th>
                  <th style={{ width: '140px' }}>View Subjects</th>
                </tr>
              </thead>
              <tbody>
                {uniqueDepartments.map((dept, idx) => (
                  <React.Fragment key={dept}>
                    <tr>
                      <td>{idx + 1}</td>
                      <td>{dept}</td>
                      <td>
                        <button
                          className={`btn btn-sm btn-${expandedDept === dept ? 'secondary' : 'primary'}`}
                          onClick={() => setExpandedDept(expandedDept === dept ? null : dept)}
                        >
                          {expandedDept === dept ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {expandedDept === dept && (
                      <tr>
                        <td colSpan={3} className="p-0">
                          <div className="p-3 bg-light">
                            {subjectsByDept(dept).length === 0 ? (
                              <p className="text-muted">No subjects for this department.</p>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-bordered table-hover mb-0">
                                  <thead className="table-light">
                                    <tr>
                                      <th>Subject Code</th>
                                      <th>Subject Name</th>
                                      <th>Section</th>
                                      <th>Semester</th>
                                      <th>Faculty</th>
                                      <th>Weekly Hours</th>
                                      <th>Lab</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {subjectsByDept(dept).map(subject => (
                                      <tr key={subject._id}>
                                        <td>{subject.subjectCode || '-'}</td>
                                        <td>{subject.name}</td>
                                        <td>{subject.section === '-' ? '-' : subject.section || '-'}</td>
                                        <td>{subject.semester}</td>
                                        <td>{subject.faculty?.name || 'N/A'}</td>
                                        <td>{subject.weeklyHours}</td>
                                        <td>{subject.isLab ? 'Yes' : 'No'}</td>
                                        <td>
                                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(subject)}>Edit</button>
                                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(subject._id)}>Delete</button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}