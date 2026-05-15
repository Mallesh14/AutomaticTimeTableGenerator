import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from '../api';
import TimetableDisplayWithPreview from '../components/TimetableDisplayWithPreview';
import GenerateTimetable from '../components/GenerateTimetable';
import ManageSubjects from '../components/ManageSubjects';
import ManageFaculty from '../components/ManageFaculty';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timetableList, setTimetableList] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState(null);

  const fetchTimetables = async () => {
    try {
      const res = await api.get('/timetable');
      setTimetableList(res.data);
    } catch (err) {
      console.error('Error fetching timetables:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') fetchTimetables();
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timetable?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      fetchTimetables();
      setSelectedTimetable(null);
    } catch (err) {
      console.error('Error deleting timetable:', err);
    }
  };

  const handlePreview = async (department, semester) => {
    try {
      const res = await api.get(`/timetable/${department}/${semester}`);
      setSelectedTimetable({ data: res.data, department, semester });
    } catch (err) {
      console.error('Error loading timetable preview:', err);
    }
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'subjects':
        return <div className="mt-4"><ManageSubjects /></div>;
      case 'faculties':
        return <div className="mt-4"><ManageFaculty /></div>;
      case 'timetable':
        return <div className="mt-4"><GenerateTimetable /></div>;
      case 'dashboard':
      default:
        return (
          <div className="mt-4">
            <h3 className="fw-bold">
              🎓 Welcome, <span className="text-primary">{user?.username || user?.name || 'Admin'}</span>
            </h3>
            <h3 className="mb-3">Generated Timetables</h3>
            {timetableList.length === 0 ? (
              <p className="text-muted">No timetable has been generated yet.</p>
            ) : (
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timetableList.map((tt) => (
                    <tr key={tt._id}>
                      <td>{tt.department.toUpperCase()}</td>
                      <td>{tt.semester}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handlePreview(tt.department, tt.semester)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(tt._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {selectedTimetable && (
              <div className="mt-4">
                <h5 className="mb-2">
                  Dept: {selectedTimetable.department.toUpperCase()} | Sem: {selectedTimetable.semester}
                </h5>
                <TimetableDisplayWithPreview
                  timetable={selectedTimetable.data}
                  department={selectedTimetable.department}
                  semester={selectedTimetable.semester}
                />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div
          className="col-md-2 bg-dark text-white p-3 vh-100 position-fixed overflow-auto"
          style={{ minHeight: '100vh' }}
        >
          <h4 className="text-center mb-4">🛠 Admin Panel</h4>
          {['dashboard', 'faculties', 'subjects', 'timetable'].map(tab => (
            <button
              key={tab}
              className={`w-100 text-start mb-2 btn border-0 bg-transparent text-white ${activeTab === tab ? 'fw-bold text-warning' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <div className="mt-3 pt-3 border-top border-secondary">
            <button className="btn btn-outline-light w-100" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
        <div className="col-md-10 offset-md-2 p-4">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}