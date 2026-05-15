import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaTrash, FaEdit, FaFilter, FaCheckCircle,FaPlus } from 'react-icons/fa';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const hours = [1, 2, 3, 4, 5, 6, 7];
const allSlots = days.flatMap(day => hours.map(hour => `${day}-${hour}`));

export default function ManageFaculty() {
  const [faculties, setFaculties] = useState([]);
  const [form, setForm] = useState({
  facultyId: '',
  name: '',
  email: '',
  department: '',
  availableSlots: []
});
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastTimeout = useRef(null);

  const fetchFaculties = async () => {
    const res = await api.get('/faculties');
    setFaculties(res.data);
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  const handleCheckboxChange = (slot) => {
    const updated = form.availableSlots.includes(slot)
      ? form.availableSlots.filter(s => s !== slot)
      : [...form.availableSlots, slot];
    setForm({ ...form, availableSlots: updated });
  };

  const handleSelectAll = () => {
    const isAll = !selectAll;
    setSelectAll(isAll);
    setForm({ ...form, availableSlots: isAll ? [...allSlots] : [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
   const { facultyId, name, email, department } = form;
if (!facultyId.trim() || !name.trim() || !email.trim() || !department.trim()) {
  setToast({ show: true, message: 'Faculty ID, Name, Email, and Department are required', type: 'danger' });
  return;
}
    try {
      if (editingFaculty) {
        await api.put(`/faculties/${editingFaculty._id}`, form);
        setToast({ show: true, message: '✅ Faculty updated', type: 'success' });
        setEditingFaculty(null);
      } else {
        await api.post('/faculties', form);
        setToast({ show: true, message: '✅ Faculty added', type: 'success' });
      }
      //setForm({ name: '', email: '', department: '', availableSlots: [] });
      setForm({ facultyId: '', name: '', email: '', department: '', availableSlots: [] });
      setSelectAll(false);
      fetchFaculties();
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Operation failed: ' + (err.response?.data?.error || 'Unexpected error'), type: 'danger' });
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

  const handleEdit = (faculty) => {
    setEditingFaculty(faculty);
    setForm({
  facultyId: faculty.facultyId || '',
  name: faculty.name,
  email: faculty.email || '',
  department: faculty.department || '',
  availableSlots: faculty.availableSlots || []
});
    setSelectAll(faculty.availableSlots?.length === allSlots.length);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingFaculty(null);
    setForm({ facultyId: '', name: '', email: '', department: '', availableSlots: [] });
    //setForm({ name: '', email: '', department: '', availableSlots: [] });
    setSelectAll(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this faculty?')) {
      try {
        await api.delete(`/faculties/${id}`);
        fetchFaculties();
      } catch (err) {
        console.error(err);
        alert('Delete failed: ' + (err.response?.data?.error || 'Unauthorized'));
      }
    }
  };


  // Unique departments for summary table
  const uniqueDepartments = Array.from(
    new Set(faculties.map(f => f.department).filter(Boolean))
  );

  // State for expanded department
  const [expandedDept, setExpandedDept] = useState(null);

  // Faculties for expanded department
  const facultiesByDept = dept => faculties.filter(f => f.department === dept);

  const filteredFaculties = filterDept
    ? faculties.filter(f => (f.department || '').toLowerCase().includes(filterDept.toLowerCase()))
    : faculties;

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
      <div className="card shadow-lg mb-4" style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%)',
        borderRadius: '15px',
        border: '1px solid rgba(33, 150, 243, 0.2)'
      }}>
        <div className="card-header text-white border-0" style={{
          background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
          borderRadius: '15px 15px 0 0'
        }}>
          <h5 className="mb-0">{editingFaculty ? 'Edit Faculty' : 'Add Faculty'}</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <input
  type="text"
  className="form-control mb-2"
  placeholder="Faculty ID"
  value={form.facultyId}
  onChange={e => setForm({ ...form, facultyId: e.target.value })}
  required
/>
              <input type="text" className="form-control" placeholder="Faculty Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="col-md-4">
              <input type="email" className="form-control" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            {/* <div className="col-md-4">
              <input type="text" className="form-control" placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div> */}
            <div className="col-md-4">
            <select
            className="form-select"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            required>
    <option value="">Select Faculty Department</option>
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
            <div className="col-12">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" checked={selectAll} onChange={handleSelectAll} id="selectAll" />
                <label className="form-check-label fw-semibold" htmlFor="selectAll">
                  Select All Available Slots
                </label>
              </div>
            </div>
            <div className="col-12" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
              <div className="mb-3 table-responsive border rounded">
  <table className="table table-bordered table-sm text-center mb-0">
    <thead className="table-light">
      <tr>
        <th>Day / Hour</th>
        {hours.map(hour => (
          <th key={hour}>Hour {hour}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {days.map(day => (
        <tr key={day}>
          <td className="fw-bold">{day}</td>
          {hours.map(hour => {
            const slot = `${day}-${hour}`;
            return (
              <td key={slot}>
                <input
                  type="checkbox"
                  checked={form.availableSlots.includes(slot)}
                  onChange={() => handleCheckboxChange(slot)}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  </table>
</div>

            </div>
            <div className="col-12 d-flex gap-2">
              <button type="submit" className="btn btn-success w-50">
                {editingFaculty ? <><FaCheckCircle /> Update</> : <><FaPlus /> Add Faculty</>}
              </button>
              {editingFaculty && (
                <button type="button" onClick={cancelEdit} className="btn btn-secondary w-50">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Department Summary Table */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Departments</h5>
          {/* <div className="input-group w-auto">
            <span className="input-group-text"><FaFilter /></span>
            <input type="text" className="form-control" placeholder="Filter by Department" value={filterDept} onChange={e => setFilterDept(e.target.value)} />
          </div> */}
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
                  <th style={{ width: '140px' }}>View Faculty</th>
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
                            {facultiesByDept(dept).length === 0 ? (
                              <p className="text-muted">No faculty for this department.</p>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-hover table-bordered mb-0">
                                  <thead className="table-light">
                                    <tr>
                                      <th>#</th><th>Faculty ID</th>
                                      <th>Name</th>
                                      <th>Email</th>
                                      <th>Available Slots</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {facultiesByDept(dept).map((f, i) => (
                                      <tr key={f._id}>
                                        <td>{i + 1}</td><td>{f.facultyId || '-'}</td>
                                        <td>{f.name}</td>
                                        <td>{f.email}</td>
                                        <td className="small">{f.availableSlots?.join(', ')}</td>
                                        <td>
                                          <div className="d-flex gap-2">
                                            <button className="btn btn-sm btn-outline-warning" onClick={() => handleEdit(f)}><FaEdit /> Edit</button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(f._id)}><FaTrash /> Delete</button>
                                          </div>
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
