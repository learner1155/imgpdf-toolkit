import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Merge, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import axios from 'axios';
import FileDropzone from '../components/FileDropzone';
import ProgressBar from '../components/ProgressBar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PDFMerger = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesSelected = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index, direction) => {
    const newFiles = [...files];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= files.length) return;
    [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error('Please select at least 2 PDF files');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('pdfs', file));
      formData.append('order', JSON.stringify(files.map((_, i) => i)));

      const response = await axios.post(`${API_URL}/api/pdf/merge`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted * 0.8);
        },
      });

      setProgress(100);
      toast.success('PDFs merged! Downloading...');
      
      // Auto download
      const link = document.createElement('a');
      link.href = `${API_URL}/download/${response.data.filename}`;
      link.download = response.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setFiles([]);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      toast.error(error.response?.data?.error || 'Failed to merge PDFs');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setProgress(0);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Merge size={24} color="#f59e0b" />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>PDF Merger</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Combine multiple PDF files into a single document
          </p>
        </div>

        {/* Main Content */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            accept={{
              'application/pdf': ['.pdf']
            }}
            files={[]}
            title="Drop PDF files here"
            subtitle="Select multiple PDFs to merge"
          />

          {loading && <ProgressBar progress={progress} status="Merging PDFs..." />}
        </div>

        {/* File List with Reordering */}
        {files.length > 0 && (
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
                {files.length} PDF{files.length !== 1 ? 's' : ''} selected
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Drag to reorder or use arrows
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {files.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'var(--surface)',
                    borderRadius: '10px',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <GripVertical size={20} color="var(--text-secondary)" style={{ cursor: 'grab' }} />
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'white',
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => moveFile(index, 'up')}
                      disabled={index === 0}
                      style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        opacity: index === 0 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ArrowUp size={16} color="#f59e0b" />
                    </button>
                    <button
                      onClick={() => moveFile(index, 'down')}
                      disabled={index === files.length - 1}
                      style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: index === files.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: index === files.length - 1 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ArrowDown size={16} color="#f59e0b" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: 'var(--error)',
                      fontWeight: '500',
                    }}
                  >
                    Remove
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleMerge}
            disabled={loading || files.length < 2}
            className="btn-primary"
            style={{ flex: 1, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
                Merging...
              </>
            ) : (
              <>
                <Merge size={20} />
                Merge {files.length} PDFs
              </>
            )}
          </button>

          {files.length > 0 && (
            <button onClick={handleClear} className="btn-secondary">
              Clear All
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PDFMerger;
