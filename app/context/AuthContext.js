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

  // Function to fetch user data from API using token
  const fetchUserData = async (token) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        return userData;
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
    return null;
  };

  // Function to validate and set user from token
  const validateAndSetUser = async (token) => {
    try {
      if (isTokenExpired(token)) {
        console.log('Token expired, logging out');
        logout();
        return false;
      }
      
      const decodedUser = jwt.decode(token);
      if (decodedUser) {
        // Try to get stored user data first
        const storedUserData = localStorage.getItem('userData');
        let userData = null;
        
        if (storedUserData) {
          try {
            userData = JSON.parse(storedUserData);
          } catch (e) {
            console.error('Failed to parse stored user data:', e);
          }
        }
        
        // If no stored user data, fetch from API
        if (!userData) {
          userData = await fetchUserData(token);
          if (userData) {
            localStorage.setItem('userData', JSON.stringify(userData));
          }
        }
        
        // Create normalized user object
        const normalizedUser = {
          ...userData,
          role: decodedUser.role,
          id: userData?.id || decodedUser.userId
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
    const initAuth = async () => {
      // Check for auth tokens in priority order
      const savedToken = localStorage.getItem('authToken') || 
                        localStorage.getItem('adminToken') || 
                        localStorage.getItem('storefront_token');
      if (savedToken) {
        const isValid = await validateAndSetUser(savedToken);
        if (!isValid) {
          // Clear all possible token keys
          localStorage.removeItem('authToken');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('storefront_token');
          localStorage.removeItem('userData');
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

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
        role: decodedToken.role,
        id: userData.id || decodedToken.userId
      };
      
      setToken(token);
      setUser(normalizedUser);
      
      // Store token with appropriate key based on role
      if (normalizedUser.role === 'admin') {
        localStorage.setItem('authToken', token);
        localStorage.setItem('adminToken', token); // Also store as adminToken for compatibility
      } else {
        localStorage.setItem('authToken', token);
      }
      
      localStorage.setItem('userData', JSON.stringify(userData)); // Store user data
      return true;
    } catch (error) {
      console.error('Failed to process login:', error);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // Clear all possible token keys
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('storefront_token');
    localStorage.removeItem('userData'); // Remove stored user data
  };

  // Helper function to get the current valid token
  const getValidToken = () => {
    return localStorage.getItem('authToken') || 
           localStorage.getItem('adminToken') || 
           localStorage.getItem('storefront_token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      loading, 
      isTokenExpired, 
      getValidToken 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);