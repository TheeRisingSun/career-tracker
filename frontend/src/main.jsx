import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TimerProvider } from './TimerContext';
import { RoleProvider } from './RoleContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <TimerProvider>
          <App />
        </TimerProvider>
      </RoleProvider>
    </BrowserRouter>
  </React.StrictMode>
);
