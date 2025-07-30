"use client"
import React, { createContext, useState, useEffect, useContext } from 'react';
import jwt from 'jsonwebtoken';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to check if token is expired
  const isTokenExpired = (token) => {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Function to validate and set user from token
  const validateAndSetUser = (token) => {
    try {
      if (isTokenExpired(token)) {
        console.log('Token expired, logging out');
        logout();
        return false;
      }
      
      const decodedUser = jwt.decode(token);
      if (decodedUser) {
        // Create normalized user object with role from JWT
        const normalizedUser = {
          ...decodedUser,
          role: decodedUser.role, // Use role from JWT token
          id: decodedUser.userId
        };
        setUser(normalizedUser);
        setToken(token);
        return true;
      }
    } catch (error) {
      console.error('Failed to decode token:', error);
      logout();
    }
    return false;
  };

  useEffect(() => {
    // Check for both regular auth token and storefront token
    const savedToken = localStorage.getItem('authToken') || localStorage.getItem('storefront_token')
    if (savedToken) {
      const isValid = validateAndSetUser(savedToken)
      if (!isValid) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('storefront_token')
      }
    }
    setLoading(false)
  }, [])

  // Check token expiration periodically
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      if (isTokenExpired(token)) {
        console.log('Token expired during session, logging out');
        logout();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [token]);

  const login = (token, userData) => {
    if (isTokenExpired(token)) {
      console.error('Cannot login with expired token');
      return false;
    }
    
    try {
      // Decode the JWT to get the role information
      const decodedToken = jwt.decode(token);
      
      // Create normalized user object combining API response and JWT data
      const normalizedUser = {
        ...userData,
        role: decodedToken.role, // Use role from JWT token
        id: userData.id || decodedToken.userId
      };
      
      setToken(token);
      setUser(normalizedUser);
      localStorage.setItem('authToken', token);
      return true;
    } catch (error) {
      console.error('Failed to process login:', error);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('storefront_token') // Also remove storefront token
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isTokenExpired }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);