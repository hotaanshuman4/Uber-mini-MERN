import React, { createContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiClient
        .get('/auth/me')
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', {
      email: String(email).trim().toLowerCase(),
      password,
    });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, role = 'rider', dlNumber = null) => {
    const res = await apiClient.post('/auth/register', {
      name,
      email: String(email).trim().toLowerCase(),
      password,
      role,
      dlNumber,
    });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const googleLoginAuth = async (accessToken, role = 'rider') => {
    const res = await apiClient.post('/auth/google', { token: accessToken, role });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLoginAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
