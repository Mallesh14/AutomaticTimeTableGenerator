import React, { useState, useEffect } from 'react';
import TimetableDisplayWithPreview from '../components/TimetableDisplayWithPreview';
import api from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Avatar, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, Tooltip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockResetIcon from '@mui/icons-material/LockReset';

export default function StudentDashboard({ user, onLogout }) {
  // Optionally load user from localStorage if not present
  const [localUser, setLocalUser] = useState(() => {
    if (user) return user;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  // Always use the latest user info
  useEffect(() => {
    if (user) setLocalUser(user);
  }, [user]);

  const [dept, setDept] = useState(localUser?.department || '');
  const [sem, setSem] = useState(localUser?.semester || '');
  const [tt, setTt] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Profile menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [showReset, setShowReset] = useState(false);
  const [resetForm, setResetForm] = useState({ oldPassword: '', newPassword: '' });
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Sync dept and sem with user/localUser
  useEffect(() => {
    if (localUser?.department) setDept(localUser.department);
    if (localUser?.semester) setSem(localUser.semester);
  }, [localUser]);

  useEffect(() => {
    if (dept && sem) {
      setLoading(true);
      fetchTimetable();
    } else {
      setLoading(false);
    }
    // Only run when dept/sem change, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept, sem]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const section = localUser?.section;
      const url = section ? 
        `/student/timetable/${dept}/${sem}?section=${encodeURIComponent(section)}` :
        `/student/timetable/${dept}/${sem}`;
      const res = await api.get(url);
      setTt(res.data);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      setTt(null);
    } finally {
      setLoading(false);
    }
  };

  // Debug: Print department, semester, and timetable
  useEffect(() => {
    console.log('DEBUG: dept:', dept, 'sem:', sem, 'section:', localUser?.section, 'tt:', tt);
  }, [dept, sem, tt, localUser]);

  if (!localUser || !localUser.department || !localUser.semester) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center edu-content">
        <div className="text-center edu-fade-in">
          <div className="mb-4">
            <div className="edu-bg-light rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{width: '80px', height: '80px'}}>
              <i className="fas fa-graduation-cap edu-text-primary" style={{fontSize: '32px'}}></i>
            </div>
          </div>
          <div className="spinner-border edu-text-primary mb-3" style={{width: '3rem', height: '3rem'}}></div>
          <h6 className="edu-text-primary fw-bold">Initializing Academic Portal</h6>
          <small className="edu-text-gray">Loading your student profile...</small>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 edu-content">
      {/* Professional Educational Header */}
      <div className="edu-header sticky-top" style={{ zIndex: 1030 }}>
        <div className="container py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="edu-fade-in">
              <h4 className="mb-1 fw-bold edu-text-primary">
                <i className="fas fa-graduation-cap me-2"></i>
                Welcome, <span className="edu-text-secondary">{localUser?.username || localUser?.name || 'Student'}</span>
              </h4>
              <small className="edu-text-gray">Academic Portal - Manage your educational journey</small>
            </div>
            <div className="d-flex align-items-center gap-3">
              <Tooltip title="Student Profile">
                <IconButton 
                  onClick={e => setAnchorEl(e.currentTarget)}
                  className="edu-scale-in"
                  sx={{ 
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'scale(1.1)' }
                  }}
                >
                  <Avatar sx={{ 
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    width: 48, 
                    height: 48,
                    boxShadow: '0 4px 15px rgba(30, 58, 138, 0.3)'
                  }}>
                    <PersonIcon fontSize="medium" />
                  </Avatar>
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {/* Enhanced Student Information Card */}
        <div className="row mb-4">
          <div className="col-md-8">
            <div className="edu-card-elevated h-100 edu-primary">
              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-2 text-center mb-3 mb-md-0">
                    <div className="bg-white bg-opacity-20 rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{width: '70px', height: '70px'}}>
                      <i className="fas fa-user-graduate text-white" style={{fontSize: '28px'}}></i>
                    </div>
                  </div>
                  <div className="col-md-10">
                    <div className="d-flex flex-wrap gap-4 align-items-center">
                      <div className="text-center">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-building text-white me-2" style={{fontSize: '16px'}}></i>
                          <small className="text-white-50">Department</small>
                        </div>
                        <h5 className="mb-0 fw-bold text-white">{dept.toUpperCase()}</h5>
                      </div>
                      <div className="text-center border-start border-end border-white border-opacity-25 px-4">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-calendar-alt text-white me-2" style={{fontSize: '16px'}}></i>
                          <small className="text-white-50">Semester</small>
                        </div>
                        <h5 className="mb-0 fw-bold text-white">{sem}</h5>
                      </div>
                      {localUser?.section && (
                        <div className="text-center">
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-users text-white me-2" style={{fontSize: '16px'}}></i>
                            <small className="text-white-50">Section</small>
                          </div>
                          <h5 className="mb-0 fw-bold text-white">{localUser.section}</h5>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="edu-card h-100">
              <div className="card-body d-flex flex-column justify-content-center align-items-center p-4">
                <div className="mb-3">
                  <div className="edu-bg-light rounded-circle d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                    <i className="fas fa-chalkboard-teacher edu-text-primary" style={{fontSize: '24px'}}></i>
                  </div>
                </div>
                <h6 className="text-center mb-2 fw-bold edu-text-primary">Class Schedule</h6>
                <small className="edu-text-gray text-center">View your academic timetable</small>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Timetable Section */}
        {loading ? (
          <div className="edu-card-elevated">
            <div className="card-body text-center py-5">
              <div className="mb-4">
                <div className="spinner-border edu-text-primary mb-3" style={{ width: '3rem', height: '3rem' }} />
              </div>
              <h6 className="edu-text-primary mb-2 fw-bold">Loading Your Academic Schedule</h6>
              <small className="edu-text-gray">Please wait while we fetch your timetable...</small>
            </div>
          </div>
        ) : tt ? (
          <div className="edu-card-elevated edu-fade-in">
            <div className="card-header text-white border-0 edu-primary" style={{
              borderRadius: '1rem 1rem 0 0'
            }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0 fw-bold d-flex align-items-center">
                    <i className="fas fa-calendar-week me-2"></i>
                    Academic Timetable
                  </h5>
                  <small className="text-white-50">Your weekly class schedule</small>
                </div>
                <div className="text-end">
                  <div className="d-flex flex-column">
                    <small className="text-white">
                      <i className="fas fa-university me-1"></i>
                      <strong>{dept.toUpperCase()}</strong> 
                      {localUser?.section && <span> - Section {localUser.section}</span>}
                    </small>
                    <small className="text-white-50">
                      <i className="fas fa-graduation-cap me-1"></i>
                      Semester {sem}
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-4 edu-bg-light">
              <TimetableDisplayWithPreview
                timetable={tt}
                department={dept}
                semester={sem}
                section={localUser?.section}
              />
            </div>
          </div>
        ) : (
          <div className="edu-card-elevated">
            <div className="card-body text-center py-5">
              <div className="mb-4">
                <div className="edu-bg-light rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{width: '100px', height: '100px'}}>
                  <i className="fas fa-calendar-times edu-text-gray" style={{fontSize: '40px'}}></i>
                </div>
              </div>
              <h6 className="edu-text-primary mb-3 fw-bold">No Timetable Available</h6>
              <p className="edu-text-gray mb-4">Your academic schedule hasn't been generated yet.</p>
              <div className="edu-alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Please contact your academic administrator for assistance.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(30, 58, 138, 0.15)',
            border: '1px solid rgba(30, 58, 138, 0.1)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)'
          }
        }}
      >
        <MenuItem 
          onClick={() => { setShowReset(true); setAnchorEl(null); }}
          sx={{ 
            py: 2, 
            px: 3,
            '&:hover': { 
              backgroundColor: 'rgba(30, 58, 138, 0.1)',
              borderRadius: 2,
              margin: '4px 8px'
            }
          }}
        >
          <LockResetIcon fontSize="small" className="me-2" sx={{ color: '#1e3a8a' }} /> 
          <span style={{ color: '#1e3a8a', fontWeight: 500 }}>Change Password</span>
        </MenuItem>
        <MenuItem 
          onClick={onLogout}
          sx={{ 
            py: 2, 
            px: 3,
            '&:hover': { 
              backgroundColor: 'rgba(220, 53, 69, 0.1)',
              borderRadius: 2,
              margin: '4px 8px'
            }
          }}
        >
          <i className="fas fa-sign-out-alt me-2" style={{color: '#dc2626'}}></i> 
          <span style={{ color: '#dc2626', fontWeight: 500 }}>Logout</span>
        </MenuItem>
      </Menu>

      {/* Professional Reset Password Dialog */}
      <Dialog 
        open={showReset} 
        onClose={() => setShowReset(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 25px 50px rgba(30, 58, 138, 0.15)',
            border: '1px solid rgba(30, 58, 138, 0.1)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: 'white',
          textAlign: 'center',
          py: 3
        }}>
          <div className="d-flex flex-column align-items-center">
            <LockResetIcon sx={{ fontSize: 40, mb: 2 }} />
            <h6 className="mb-0 fw-bold">Reset Password</h6>
            <small className="text-white-50 mt-1">Update your account credentials</small>
          </div>
        </DialogTitle>
        <DialogContent sx={{ p: 4, minWidth: 400 }}>
          {resetError && (
            <div className="edu-alert-error text-center mb-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {resetError}
            </div>
          )}
          {resetSuccess && (
            <div className="edu-alert-success text-center mb-3">
              <i className="fas fa-check-circle me-2"></i>
              {resetSuccess}
            </div>
          )}
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            margin="normal"
            value={resetForm.oldPassword}
            onChange={e => setResetForm(f => ({ ...f, oldPassword: e.target.value }))}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                '&:hover fieldset': { borderColor: '#1e3a8a' },
                '&.Mui-focused fieldset': { borderColor: '#1e3a8a' }
              },
              '& .MuiInputLabel-root.Mui-focused': { color: '#1e3a8a' }
            }}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            value={resetForm.newPassword}
            onChange={e => setResetForm(f => ({ ...f, newPassword: e.target.value }))}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                '&:hover fieldset': { borderColor: '#1e3a8a' },
                '&.Mui-focused fieldset': { borderColor: '#1e3a8a' }
              },
              '& .MuiInputLabel-root.Mui-focused': { color: '#1e3a8a' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 2, gap: 2 }}>
          <Button 
            onClick={() => setShowReset(false)} 
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              color: '#64748b',
              border: '2px solid #e2e8f0',
              fontWeight: 600,
              '&:hover': { 
                backgroundColor: '#f1f5f9',
                borderColor: '#cbd5e1'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setResetError(''); setResetSuccess('');
              if (!resetForm.oldPassword || !resetForm.newPassword) {
                setResetError('Both fields are required'); return;
              }
              try {
                await api.post('/auth/reset-password', {
                  email: localUser?.email,
                  oldPassword: resetForm.oldPassword,
                  newPassword: resetForm.newPassword,
                });
                setResetSuccess('Password updated successfully');
                setTimeout(() => setShowReset(false), 1500);
              } catch (err) {
                setResetError(err.response?.data?.error || 'Failed to reset password');
              }
            }}
            variant="contained"
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(30, 58, 138, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                boxShadow: '0 6px 20px rgba(30, 58, 138, 0.4)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <i className="fas fa-key me-2"></i>
            Update Password
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
