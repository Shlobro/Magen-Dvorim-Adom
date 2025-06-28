import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HomeScreen from '../pages/HomeScreen';

export default function HomeRedirect() {
  const { currentUser, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser && userRole !== null) {
      // If user is logged in, redirect to their appropriate dashboard
      if (userRole === 1) {
        // Coordinator - go to reports dashboard
        navigate('/dashboard');
      } else if (userRole === 2) {
        // Volunteer - go to volunteer dashboard
        navigate('/volunteer-dashboard');
      }
    }
  }, [currentUser, userRole, loading, navigate]);

  // If loading or not logged in, show the regular home screen
  if (loading || !currentUser) {
    return <HomeScreen />;
  }

  // If logged in but still waiting for role redirect, show a loading state
  return <HomeScreen />;
}
