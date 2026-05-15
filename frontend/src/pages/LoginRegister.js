import React, { useState } from 'react';
import api from '../api';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Alert,
  Box,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';

function LoginForm({ onLogin, switchToRegister }) {
  const [loginType, setLoginType] = useState('user'); // user or faculty
  const [formData, setFormData] = useState({ email: '', password: '', facultyId: '' });
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ADMIN LOGIN
    if (
      loginType === 'user' &&
      formData.email === 'admin@mec.in' &&
      formData.password === 'mec@123'
    ) {
      localStorage.setItem('token', 'admin-token');
      localStorage.setItem(
        'user',
        JSON.stringify({ email: formData.email, role: 'admin' })
      );
      onLogin({ email: formData.email, role: 'admin', token: 'admin-token' });
      return;
    }

    try {
      if (loginType === 'faculty') {
    console.log('Attempting faculty login with:', {
      email: formData.email,
      facultyId: formData.facultyId,
    });
        const res = await api.post('/auth/faculty-login', {
          email: formData.email,
          facultyId: formData.facultyId,
        });
        console.log('Faculty login successful. Response:', res.data);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      } else {
        const res = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <Box>
      <Typography variant="h5" className="text-center mb-3">
        Login
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          type="email"
          required
        />

        {loginType === 'user' && (
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            type="password"
            required
          />
        )}

        {loginType === 'faculty' && (
          <TextField
            fullWidth
            margin="normal"
            label="Faculty ID"
            name="facultyId"
            value={formData.facultyId}
            onChange={handleChange}
            required
          />
        )}

        <Button 
          type="submit" 
          fullWidth 
          variant="contained"
          sx={{
            mt: 3,
            mb: 2,
            py: 1.5,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 4px 15px rgba(30, 58, 138, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
              boxShadow: '0 6px 20px rgba(30, 58, 138, 0.4)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          <i className="fas fa-sign-in-alt me-2"></i>
          Login to Academic Portal
        </Button>
      </form>

      <Typography variant="body2" className="text-center mt-3">
        Don’t have an account? <Button onClick={switchToRegister}>Register</Button>
      </Typography>
    </Box>
  );
}

function RegisterForm({ switchToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    semester: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = { ...formData };
    if (formData.role === 'faculty') delete payload.semester;
    if (formData.role === 'admin') {
      delete payload.semester;
      delete payload.department;
    }

    try {
      const res = await api.post('/auth/register', payload);
      setSuccess(res.data.message || 'Registered successfully');
      setTimeout(() => switchToLogin(), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <Box>
      <Typography variant="h5" className="text-center mb-3 text-success fw-bold">
        📝 Register
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          type="email"
        />
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          type="password"
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select name="role" value={formData.role} onChange={handleChange}>
            <MenuItem value="student">Student</MenuItem>
            {/* <MenuItem value="faculty">🧑‍🏫 Faculty</MenuItem> */}
          </Select>
        </FormControl>

        {(formData.role === 'student' || formData.role === 'faculty') && (
          <FormControl fullWidth margin="normal">
            <InputLabel>Department</InputLabel>
            <Select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              label="Department"
            >
              <MenuItem value="">Select Department</MenuItem>
              <MenuItem value="CSE">CSE</MenuItem>
              <MenuItem value="IT">IT</MenuItem>
              <MenuItem value="ECE">ECE</MenuItem>
              <MenuItem value="EEE">EEE</MenuItem>
              <MenuItem value="MECH">MECH</MenuItem>
              <MenuItem value="CIVIL">CIVIL</MenuItem>
              <MenuItem value="AIDS">AIDS</MenuItem>
              <MenuItem value="AIML">AIML</MenuItem>
              <MenuItem value="CSBS">CSBS</MenuItem>
              <MenuItem value="CSE(CS)">CSE(CS)</MenuItem>
              <MenuItem value="BIOTECH">BIOTECH</MenuItem>
              <MenuItem value="BIOMED">BIOMED</MenuItem>
              <MenuItem value="S&H">S&H</MenuItem>
              <MenuItem value="MBA">MBA</MenuItem>
              <MenuItem value="MCA">MCA</MenuItem>
              <MenuItem value="MATHS">MATHS</MenuItem>
            </Select>
          </FormControl>
        )}

        {formData.role === 'student' && (
          <FormControl fullWidth margin="normal">
            <InputLabel>Semester</InputLabel>
            <Select
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              required
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Button fullWidth type="submit" variant="contained" color="success">
          Register
        </Button>
      </form>
      <Typography variant="body2" className="text-center mt-3">
        Already have an account? <Button onClick={switchToLogin}>Login</Button>
      </Typography>
    </Box>
  );
}

export default function LoginRegister({ onLogin }) {
  const [view, setView] = useState('login');

  return (
    <Box
      className="d-flex justify-content-center align-items-center min-vh-100"
      sx={{ backgroundColor: '#f5f5f5' }}
    >
          {/* bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)
          `,
          pointerEvents: 'none' */}
        {/* }
      }} */}

      <Paper 
        elevation={12} 
        className="edu-card-elevated position-relative"
        sx={{ 
          width: '100%', 
          maxWidth: 480, 
          p: 5,
          zIndex: 1,
          backdropFilter: 'blur(20px)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
          border: '1px solid rgba(30, 58, 138, 0.1)'
        }}
      >
        {view === 'login' && (
          <LoginForm
            onLogin={onLogin}
            switchToRegister={() => setView('register')}
          />
        )}
        {view === 'register' && (
          <RegisterForm switchToLogin={() => setView('login')} />
        )}
      </Paper>
    </Box>
  );
}
