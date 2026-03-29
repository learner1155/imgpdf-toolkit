import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileImage, FileText, X } from 'lucide-react';

const FileDropzone = ({ 
  onFilesSelected, 
  accept, 
  multiple = true, 
  maxFiles = 20,
  files = [],
  onRemoveFile,
  title = "Drop files here",
  subtitle = "or click to browse",
  validator
}) => {
  const onDrop = useCallback((acceptedFiles) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxFiles,
    validator,
  });

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <FileImage size={24} color="var(--primary)" />;
    if (file.type === 'application/pdf') return <FileText size={24} color="#ef4444" />;
    return <FileText size={24} color="var(--text-secondary)" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ y: isDragActive ? -5 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: isDragActive 
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}>
            <Upload size={32} color={isDragActive ? 'var(--success)' : 'var(--primary)'} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: 'var(--text)',
            }}>
              {isDragActive ? 'Drop files here!' : title}
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)' 
            }}>
              {subtitle}
            </p>
          </div>
        </motion.div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <p style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: 'var(--text-secondary)',
          }}>
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {files.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="file-item"
              >
                {getFileIcon(file)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {onRemoveFile && (
                  <button
                    onClick={() => onRemoveFile(index)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                  >
                    <X size={16} color="var(--error)" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
