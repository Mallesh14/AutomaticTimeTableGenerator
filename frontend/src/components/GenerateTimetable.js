import React, { useEffect, useState } from 'react';
import api from '../api';
// import TimetableDisplay from './TimetableDisplay';
import TimetableDisplayWithPreview from './TimetableDisplayWithPreview';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaTools, FaSpinner } from 'react-icons/fa';

export default function GenerateTimetable() {
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState('');
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null); // stores generation failure info
  const [allTimetables, setAllTimetables] = useState([]);
  const [showAllTimetables, setShowAllTimetables] = useState(true);

  useEffect(() => {
    fetchDepartments();
    fetchAllTimetables();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/subjects/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error("Error fetching departments", err);
      alert("⚠ Failed to load departments");
    }
  };

  const fetchAllTimetables = async () => {
    try {
      const res = await api.get('/timetable');
      setAllTimetables(res.data);
    } catch (err) {
      console.error("Error fetching timetables", err);
    }
  };

  // Fetch sections for selected department
  const fetchSections = async (dept) => {
    try {
      const res = await api.get(`/subjects/sections/${dept.toUpperCase()}`);
      setSections(res.data);
    } catch (err) {
      setSections([]);
    }
  };

  const handleDeleteTimetable = async (timetableId) => {
    if (window.confirm('Are you sure you want to delete this timetable? This action cannot be undone.')) {
      try {
        await api.delete(`/timetable/${timetableId}`);
        fetchAllTimetables(); // Refresh the list
        alert('Timetable deleted successfully!');
      } catch (err) {
        console.error('Error deleting timetable:', err);
        alert('Failed to delete timetable. Please try again.');
      }
    }
  };

  const handleGenerate = async () => {
    if (!department || !semester) {
      alert("⚠ Please select both department and semester");
      return;
    }

    try {
      setLoading(true);
      setTimetable(null);
      setErrorInfo(null);

      // First, check if timetable already exists
      const checkUrl = section ? 
        `/timetable/check/${department}/${semester}?section=${encodeURIComponent(section)}` : 
        `/timetable/check/${department}/${semester}`;
        
      console.log('🔍 Checking for existing timetable...');
      const checkRes = await api.get(checkUrl);
      
      if (checkRes.data.exists) {
        console.log('📦 Found existing timetable, displaying it');
        setTimetable(checkRes.data.timetable);
        fetchAllTimetables(); // Refresh the list
        return;
      }
      
      // If no existing timetable, generate a new one
      console.log('🚀 No existing timetable found, generating new one...');
      const generateUrl = section ? 
        `/timetable/${department}/${semester}?section=${encodeURIComponent(section)}` : 
        `/timetable/${department}/${semester}`;
        
      const res = await api.get(generateUrl);
      setTimetable(res.data);
      fetchAllTimetables(); // Refresh the list
      
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data;
      if (msg && msg.totalTheoryHours !== undefined) {
        setErrorInfo({
          message: msg.error,
          totalTheoryHours: msg.totalTheoryHours,
          totalLabHours: msg.totalLabHours,
          combinedHours: msg.combinedHours,
        });
      } else {
        alert("Failed to generate timetable");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px',
      padding: '20px'
    }}>
      {/* Existing Timetables Section */}
      {/* {showAllTimetables && (
        <div className="card shadow-lg border-0 mb-4" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '15px',
          border: '1px solid rgba(33, 150, 243, 0.1)'
        }}>
          <div className="card-header" style={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            borderRadius: '15px 15px 0 0'
          }}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-white">
                <i className="fas fa-calendar-alt me-2"></i>
                Existing Timetables ({allTimetables.length})
              </h5>
              <button 
                className="btn btn-sm btn-light"
                onClick={() => setShowAllTimetables(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div className="card-body">
            {allTimetables.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Section</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTimetables.map((tt, idx) => (
                      <tr key={tt._id || idx}>
                        <td className="fw-bold text-primary">{tt.department?.toUpperCase()}</td>
                        <td>{tt.semester}</td>
                        <td>{tt.section || 'All Sections'}</td>
                        <td>{new Date(tt.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                setTimetable(tt);
                                setDepartment(tt.department);
                                setSemester(tt.semester);
                                setSection(tt.section || '');
                                setShowAllTimetables(false);
                              }}
                              title="View Timetable"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteTimetable(tt._id)}
                              title="Delete Timetable"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="fas fa-calendar-times text-muted" style={{fontSize: '48px'}}></i>
                <h6 className="text-muted mt-3">No timetables found</h6>
                <p className="text-muted">Generate your first timetable below</p>
              </div>
            )}
          </div>
        </div>
      )} */}

      {!showAllTimetables && (
        <div className="text-center mb-4">
          <button 
            className="btn btn-outline-success"
            onClick={() => setShowAllTimetables(true)}
          >
            <i className="fas fa-list me-2"></i>
            Show All Timetables ({allTimetables.length})
          </button>
        </div>
      )}

      {/* Generate Timetable Form */}
      <div className="card shadow-lg border-0" style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%)',
        borderRadius: '15px',
        border: '1px solid rgba(33, 150, 243, 0.1)'
      }}>
        <div
          className="card-header text-white"
          style={{
            background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
            borderRadius: '15px 15px 0 0'
          }}
        >
          <h4 className="mb-0">
            <FaTools className="me-2" />
            Generate Timetable
          </h4>
        </div>

        <div className="card-body">
          <div className="row g-3 align-items-end">

            <div className="col-md-4">
              <label className="form-label fw-semibold">Department</label>
              <select
                className="form-select"
                value={department}
                onChange={async (e) => {
                  setDepartment(e.target.value);
                  setSection('');
                  setSections([]);
                  if (e.target.value) await fetchSections(e.target.value);
                }}
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept, idx) => (
                  <option key={idx} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {department && (
              <div className="col-md-3">
                <label className="form-label fw-semibold">Section</label>
                <select
                  className="form-select"
                  value={section}
                  onChange={e => setSection(e.target.value)}
                >
                  <option value="">-- Select Section --</option>
                  {sections.map((sec, idx) => (
                    <option key={idx} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-md-3">
              <label className="form-label fw-semibold">Semester</label>
              <select
                className="form-select"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="">-- Select Semester --</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <button
                className="btn btn-primary w-100 fw-bold py-2"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="me-2 spinner-border-sm spinner-border" />
                    Generating...
                  </>
                ) : (
                  '🚀 Generate Timetable'
                )}
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center mt-4 mb-2">
              <div
                className="spinner-border text-primary"
                style={{ width: '3rem', height: '3rem' }}
              />
              <p className="mt-3 text-muted">⏳ Generating timetable, please wait...</p>
            </div>
          )}

          {!loading && errorInfo && (
            <div className="alert alert-danger mt-4" role="alert">
              <h6 className="mb-2">Timetable Generation Failed</h6>
              <p className="mb-1">Message: {errorInfo.message}</p>
              <ul className="mb-0 ps-3">
                <li><strong>Theory Hours:</strong> {errorInfo.totalTheoryHours}</li>
                <li><strong>Lab Hours:</strong> {errorInfo.totalLabHours}</li>
                <li><strong>Total Hours:</strong> {errorInfo.combinedHours}</li>
              </ul>
              <small className="text-muted">⚠ Consider reducing total subject load or adjusting faculty availability.</small>
            </div>
          )}

          {!loading && timetable && (
            <div className="mt-5">
              <TimetableDisplayWithPreview
                timetable={timetable}
                department={department}
                semester={semester}
                section={section}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}