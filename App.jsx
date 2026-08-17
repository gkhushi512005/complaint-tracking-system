import React from 'react';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f3f4f6',
      color: '#1f2937'
    }}>
      <div style={{
        background: '#ffffff',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb', marginBottom: '12px' }}>
          Complaint & Issue Tracking System
        </h1>
        <p style={{ color: '#4b5563', marginBottom: '20px' }}>
          MERN Stack Application with JWT & Role-Based Access Control is now live on Render!
        </p>
        <span style={{
          background: '#dcfce7',
          color: '#15803d',
          padding: '6px 16px',
          borderRadius: '9999px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          ● System Operational
        </span>
      </div>
    </div>
  );
}

export default App;
