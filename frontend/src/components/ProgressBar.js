import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ progress, status = '' }) => {
  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '8px' 
      }}>
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          {status || 'Processing...'}
        </span>
        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary)' }}>
          {Math.round(progress)}%
        </span>
      </div>
      <div className="progress-bar">
        <motion.div
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
