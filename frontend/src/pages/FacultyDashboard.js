import React, { useEffect, useState } from 'react';
import api from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const hours = [1, 2, 3, 4, 5, 6, 7];

export default function FacultyDashboard({ user, onLogout }) {
  // Reset password state
  const [resetPw, setResetPw] = useState({ oldPassword: '', newPassword: '', confirmNew: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [showPwSection, setShowPwSection] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    api.get(`/faculties/dashboard/${user.email}`)
      .then(res => {
        setInfo(res.data);
        setError('');
      })
      .catch(err => {
        console.error(err);
        setError('Error loading faculty data.');
      })
      .finally(() => setLoading(false));
  }, [user.email]);

  // Handle password reset
  const handlePwChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (!resetPw.oldPassword || !resetPw.newPassword || !resetPw.confirmNew) {
      setPwMsg('All fields are required.');
      return;
    }
    if (resetPw.newPassword !== resetPw.confirmNew) {
      setPwMsg('New passwords do not match.');
      return;
    }

    setPwLoading(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: resetPw.oldPassword,
        newPassword: resetPw.newPassword,
      });
      setPwMsg('Password updated successfully!');
      setResetPw({ oldPassword: '', newPassword: '', confirmNew: '' });
      setTimeout(() => setShowPwSection(false), 2000);
    } catch (err) {
      setPwMsg(err.response?.data?.error || 'Password update failed.');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center edu-content">
        <div className="text-center edu-fade-in">
          <div className="mb-4">
            <div className="edu-bg-light rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{width: '80px', height: '80px'}}>
              <i className="fas fa-chalkboard-teacher edu-text-primary" style={{fontSize: '32px'}}></i>
            </div>
          </div>
          <div className="spinner-border edu-text-primary mb-3" style={{width: '3rem', height: '3rem'}}></div>
          <h6 className="edu-text-primary fw-bold">Loading Faculty Portal</h6>
          <small className="edu-text-gray">Preparing your dashboard...</small>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center edu-content">
        <div className="text-center">
          <div className="edu-card p-5">
            <div className="mb-4">
              <div className="bg-danger bg-opacity-10 rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{width: '80px', height: '80px'}}>
                <i className="fas fa-exclamation-triangle text-danger" style={{fontSize: '32px'}}></i>
              </div>
            </div>
            <h5 className="text-danger fw-bold mb-3">Error Loading Faculty Data</h5>
            <p className="edu-text-gray mb-4">{error}</p>
            <button className="edu-button-primary" onClick={() => window.location.reload()}>
              <i className="fas fa-redo me-2"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!info) return null;

  const { subjects = [], totalHours = 0, timetable = {}, facultyName = '' } = info;
  const deptMap = Object.fromEntries(subjects.map(s => [s.name, s.department]));

  return (
    <div className="min-vh-100 edu-content">
      {/* Professional Header */}
      <div className="edu-header border-bottom">
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="edu-fade-in">
              <h4 className="mb-1 fw-bold edu-text-primary">
                <i className="fas fa-chalkboard-teacher me-2"></i>
                Welcome, <span className="edu-text-secondary">{facultyName}</span>
              </h4>
              <small className="edu-text-gray">Faculty Portal - Manage your academic activities</small>
            </div>
            <div className="position-relative">
              <div 
                className="d-flex align-items-center gap-3 p-3 rounded-3 edu-card"
                style={{cursor: 'pointer'}}
                onClick={() => setShowMenu((v) => !v)}
              >
                <div className="edu-bg-light rounded-circle d-flex align-items-center justify-content-center" style={{width: '45px', height: '45px'}}>
                  <i className="fas fa-user-tie edu-text-primary" style={{fontSize: '20px'}}></i>
                </div>
                <div className="text-start">
                  <div className="fw-semibold edu-text-primary" style={{fontSize: '0.9rem'}}>{facultyName}</div>
                  <small className="edu-text-gray">Faculty Member</small>
                </div>
                <i className="fas fa-chevron-down edu-text-gray" style={{fontSize: '12px'}}></i>
              </div>
              
              {showMenu && (
                <div className="position-absolute end-0 mt-2 edu-card-elevated" style={{minWidth: '200px', zIndex: 1000}}>
                  <div className="p-2">
                    <button 
                      className="btn w-100 text-start mb-2 edu-nav-item"
                      onClick={() => { setShowPwSection((v) => !v); setShowMenu(false); }}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent'
                      }}
                    >
                      <i className="fas fa-key edu-text-primary me-2"></i>
                      <span className="edu-text-primary">Change Password</span>
                    </button>
                    <button 
                      className="btn w-100 text-start"
                      onClick={onLogout}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent'
                      }}
                    >
                      <i className="fas fa-sign-out-alt text-danger me-2"></i>
                      <span className="text-danger">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {/* Reset Password Section */}
        {showPwSection && (
          <div className="edu-card-elevated mb-4 edu-fade-in">
            <div className="card-header edu-secondary border-0 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold text-white">
                <i className="fas fa-shield-alt me-2"></i>
                Update Password
              </h6>
              <button 
                className="btn btn-sm text-white" 
                onClick={() => setShowPwSection(false)}
                style={{background: 'rgba(255,255,255,0.2)', border: 'none'}}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="card-body p-4">
              <form className="row g-3" onSubmit={handlePwChange} autoComplete="off">
                <div className="col-md-4">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Current Password"
                    value={resetPw.oldPassword}
                    onChange={e => setResetPw({ ...resetPw, oldPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="New Password"
                    value={resetPw.newPassword}
                    onChange={e => setResetPw({ ...resetPw, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Confirm New Password"
                    value={resetPw.confirmNew}
                    onChange={e => setResetPw({ ...resetPw, confirmNew: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12 d-flex align-items-center gap-2 mt-2">
                  <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  {pwMsg && (
                    <span className={pwMsg.includes('success') || pwMsg.includes('updated') ? 'text-success' : 'text-danger'}>
                      {pwMsg}
                    </span>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Subjects Section */}
        <div className="edu-card-elevated mb-4">
          <div className="card-header edu-primary border-0">
            <h5 className="mb-0 fw-bold text-white">
              <i className="fas fa-book me-2"></i>
              Subjects You Handle
            </h5>
          </div>
          <div className="card-body">
            {subjects.length ? (
              <div className="row">
                {[...subjects].sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                  <div key={s._id} className="col-md-6 mb-3">
                    <div className="edu-card h-100">
                      <div className="card-body">
                        <h6 className="fw-bold edu-text-primary mb-2">{s.name}</h6>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small className="edu-text-gray">
                              <i className="fas fa-building me-1"></i>
                              Dept: <span className="text-uppercase fw-semibold">{s.department}</span>
                            </small>
                            <br />
                            <small className="edu-text-gray">
                              <i className="fas fa-layer-group me-1"></i>
                              Semester: {s.semester}
                            </small>
                          </div>
                          <span className="badge edu-badge-primary">{s.weeklyHours} hrs/week</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="edu-bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                  <i className="fas fa-book-open edu-text-gray" style={{fontSize: '24px'}}></i>
                </div>
                <h6 className="edu-text-gray">No Subjects Assigned</h6>
                <p className="edu-text-gray small mb-0">No subjects have been assigned to you yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Total Hours Card */}
        <div className="edu-card-elevated mb-4">
          <div className="card-body text-center">
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="d-flex align-items-center justify-content-center justify-content-md-start">
                  <div className="edu-bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px'}}>
                    <i className="fas fa-clock text-white" style={{fontSize: '20px'}}></i>
                  </div>
                  <div className="text-start">
                    <h4 className="mb-0 fw-bold edu-text-primary">{totalHours}</h4>
                    <small className="edu-text-gray">Total Weekly Hours</small>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="text-md-end mt-3 mt-md-0">
                  <small className="edu-text-gray">Academic Load Status</small>
                  <div className="progress mt-2" style={{height: '8px'}}>
                    <div 
                      className="progress-bar bg-success" 
                      role="progressbar" 
                      style={{width: `${Math.min((totalHours / 24) * 100, 100)}%`}}
                    ></div>
                  </div>
                  <small className="edu-text-gray">{totalHours}/24 hours</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timetable Section */}
        <div className="edu-card-elevated">
          <div className="card-header edu-secondary border-0">
            <h5 className="mb-0 fw-bold text-white">
              <i className="fas fa-calendar-alt me-2"></i>
              Your Weekly Timetable
            </h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="edu-bg-light">
                  <tr>
                    <th className="border-0 edu-text-primary fw-semibold">Day</th>
                    {hours.map(h => (
                      <th key={h} className="border-0 edu-text-primary fw-semibold text-center">
                        Hour {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map(day => (
                    <tr key={day}>
                      <td className="fw-bold edu-text-primary">{day}</td>
                      {hours.map((_, i) => {
                        const slot = timetable?.[day]?.[i];
                        return (
                          <td
                            key={i}
                            className={`text-center ${slot?.isLab ? 'bg-warning bg-opacity-25' : ''}`}
                            style={{ verticalAlign: 'middle', minWidth: '120px' }}
                          >
                            {slot ? (
                              <div>
                                <div className="fw-semibold edu-text-dark">{slot.subject}</div>
                                <small className="edu-text-gray">
                                  {deptMap[slot.subject]?.toUpperCase() || 'N/A'}
                                </small>
                                {slot.isLab && (
                                  <div>
                                    <span className="badge bg-warning text-dark">Lab</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="edu-text-gray">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
