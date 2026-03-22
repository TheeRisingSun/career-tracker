import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';
import { useLocation } from 'react-router-dom';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [roleConfig, setRoleConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      api.syllabus.config()
        .then(setRoleConfig)
        .catch(err => console.error('Failed to load role config:', err))
        .finally(() => setLoading(false));
    } else {
      setRoleConfig(null);
      setLoading(false);
    }
  }, [isAuthenticated, location.pathname]); // Reload config on login/page change

  const labels = roleConfig?.labels || {
    logo: 'Tracker',
    moduleSyllabus: 'Syllabus',
    moduleRoutine: 'Routine',
    moduleRecords: 'Records',
    moduleNotes: 'Notes',
    moduleLinks: 'Links',
    moduleWhiteboards: 'Whiteboards',
    paper: 'Paper',
    subject: 'Subject',
    chapter: 'Chapter',
    topic: 'Topic',
    recordTypeTest: 'Test',
    recordTypeMistake: 'Mistake',
    recordScore: 'Marks',
    recordMax: 'Max Marks',
  };

  return (
    <RoleContext.Provider value={{ roleConfig, labels, loading }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
