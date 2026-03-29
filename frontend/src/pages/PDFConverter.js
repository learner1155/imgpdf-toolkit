import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { RefreshCw, FileText, Settings, ArrowUp, ArrowDown, RotateCw } from 'lucide-react';
import axios from 'axios';
import FileDropzone from '../components/FileDropzone';
import ProgressBar from '../components/ProgressBar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PDFConverter = () => {
  const [mode, setMode] = useState('images-to-pdf');
  const [files, setFiles] = useState([]);
  const [pageSize, setPageSize] = useState('a4');
  const [margin, setMargin] = useState(20);
  const [alignment, setAlignment] = useState('center');
  const [rotateAngle, setRotateAngle] = useState(90);
  const [rotatePages, setRotatePages] = useState('');
  const [numberPosition, setNumberPosition] = useState('bottom-center');
  const [numberFormat, setNumberFormat] = useState('simple');
  const [startNumber, setStartNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const modes = [
    { value: 'images-to-pdf', label: 'Images to PDF', icon: FileText, color: '#ec4899' },
    { value: 'rotate', label: 'Rotate PDF', icon: RotateCw, color: '#8b5cf6' },
    { value: 'add-numbers', label: 'Add Page Numbers', icon: FileText, color: '#22c55e' },
  ];

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

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.error('Please select files');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      
      if (mode === 'images-to-pdf') {
        files.forEach(file => formData.append('images', file));
        formData.append('pageSize', pageSize);
        formData.append('margin', margin.toString());
        formData.append('alignment', alignment);
        formData.append('order', JSON.stringify(files.map((_, i) => i)));

        const response = await axios.post(`${API_URL}/api/pdf/images-to-pdf`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted * 0.8);
          },
        });

        setProgress(100);
        toast.success('PDF created! Downloading...');
        
        // Auto download
        const link = document.createElement('a');
        link.href = `${API_URL}/download/${response.data.filename}`;
        link.download = response.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setFiles([]);
      } else if (mode === 'rotate') {
        formData.append('pdf', files[0]);
        formData.append('angle', rotateAngle.toString());
        if (rotatePages) formData.append('pages', rotatePages);

        const response = await axios.post(`${API_URL}/api/pdf/rotate`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setProgress(100);
        toast.success('PDF rotated! Downloading...');
        
        // Auto download
        const link = document.createElement('a');
        link.href = `${API_URL}/download/${response.data.filename}`;
        link.download = response.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setFiles([]);
      } else if (mode === 'add-numbers') {
        formData.append('pdf', files[0]);
        formData.append('position', numberPosition);
        formData.append('format', numberFormat);
        formData.append('startNumber', startNumber.toString());

        const response = await axios.post(`${API_URL}/api/pdf/add-page-numbers`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setProgress(100);
        toast.success('Page numbers added! Downloading...');
        
        // Auto download
        const link = document.createElement('a');
        link.href = `${API_URL}/download/${response.data.filename}`;
        link.download = response.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setFiles([]);
      }
    } catch (error) {
      console.error('Error processing:', error);
      toast.error(error.response?.data?.error || 'Failed to process');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setProgress(0);
  };

  const getAcceptedFiles = () => {
    if (mode === 'images-to-pdf') {
      return {
        'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']
      };
    }
    return {
      'application/pdf': ['.pdf']
    };
  };

  const currentMode = modes.find(m => m.value === mode);

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
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(219, 39, 119, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <RefreshCw size={24} color="#ec4899" />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>PDF Converter</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Convert images or documents to PDF, rotate pages, or add page numbers
          </p>
        </div>

        {/* Mode Selection */}
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {modes.map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.value}
                  onClick={() => {
                    setMode(m.value);
                    setFiles([]);
                  }}
                  style={{
                    flex: '1 1 150px',
                    padding: '16px',
                    background: mode === m.value ? `${m.color}20` : 'var(--surface)',
                    border: mode === m.value ? `2px solid ${m.color}` : '2px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Icon size={24} color={mode === m.value ? m.color : 'var(--text-secondary)'} style={{ marginBottom: '8px' }} />
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: mode === m.value ? 'var(--text)' : 'var(--text-secondary)',
                  }}>
                    {m.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            accept={getAcceptedFiles()}
            multiple={mode === 'images-to-pdf'}
            files={mode === 'images-to-pdf' ? [] : files}
            onRemoveFile={mode !== 'images-to-pdf' ? handleRemoveFile : undefined}
            title={mode === 'images-to-pdf' ? 'Drop images here' : 'Drop PDF file here'}
            subtitle={mode === 'images-to-pdf' ? 'PNG, JPG, WebP, GIF supported' : 'Select a PDF to process'}
          />

          {loading && <ProgressBar progress={progress} status="Processing..." />}
        </div>

        {/* Image List for images-to-pdf mode */}
        {mode === 'images-to-pdf' && files.length > 0 && (
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
                {files.length} image{files.length !== 1 ? 's' : ''} selected
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Reorder for page sequence
              </p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '12px',
            }}>
              {files.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(236, 72, 153, 0.2)',
                  }}
                >
                  <div style={{
                    height: '100px',
                    background: 'var(--background)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={file.name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                  <div style={{ padding: '10px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '8px',
                    }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: 'white',
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ 
                        fontSize: '12px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}>
                        {file.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => moveFile(index, 'up')}
                        disabled={index === 0}
                        style={{
                          flex: 1,
                          background: 'rgba(236, 72, 153, 0.1)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          opacity: index === 0 ? 0.5 : 1,
                        }}
                      >
                        <ArrowUp size={14} color="#ec4899" />
                      </button>
                      <button
                        onClick={() => moveFile(index, 'down')}
                        disabled={index === files.length - 1}
                        style={{
                          flex: 1,
                          background: 'rgba(236, 72, 153, 0.1)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px',
                          cursor: index === files.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: index === files.length - 1 ? 0.5 : 1,
                        }}
                      >
                        <ArrowDown size={14} color="#ec4899" />
                      </button>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        style={{
                          flex: 1,
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px',
                          cursor: 'pointer',
                          color: 'var(--error)',
                          fontSize: '12px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        {files.length > 0 && (
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '20px',
            }}>
              <Settings size={20} color={currentMode?.color} />
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Settings</h3>
            </div>

            {mode === 'images-to-pdf' && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                  }}>
                    Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className="select-field"
                  >
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                    <option value="legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                  }}>
                    Image Alignment
                  </label>
                  <select
                    value={alignment}
                    onChange={(e) => setAlignment(e.target.value)}
                    className="select-field"
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                  }}>
                    Margin ({margin}px)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={margin}
                    onChange={(e) => setMargin(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: '#ec4899',
                    }}
                  />
                </div>
              </div>
            )}

            {mode === 'rotate' && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                  }}>
                    Rotation Angle
                  </label>
                  <select
                    value={rotateAngle}
                    onChange={(e) => setRotateAngle(parseInt(e.target.value))}
                    className="select-field"
                  >
                    <option value={90}>90° Clockwise</option>
                    <option value={180}>180°</option>
                    <option value={270}>90° Counter-clockwise</option>
                  </select>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                  }}>
                    Pages (optional)
                  </label>
                  <input
                    type="text"
                    value={rotatePages}
                    onChange={(e) => setRotatePages(e.target.value)}
                    placeholder="All pages (e.g., 1, 3-5)"
                    className="input-field"
                  />
                </div>
              </div>
            )}

            {mode === 'add-numbers' && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                  }}>
                    Position
                  </label>
                  <select
                    value={numberPosition}
                    onChange={(e) => setNumberPosition(e.target.value)}
                    className="select-field"
                  >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                  </select>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                  }}>
                    Format
                  </label>
                  <select
                    value={numberFormat}
                    onChange={(e) => setNumberFormat(e.target.value)}
                    className="select-field"
                  >
                    <option value="simple">1, 2, 3...</option>
                    <option value="page-of-total">Page 1 of 10</option>
                  </select>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                  }}>
                    Start Number
                  </label>
                  <input
                    type="number"
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                    min="1"
                    className="input-field"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleConvert}
            disabled={loading || files.length === 0}
            className="btn-primary"
            style={{ flex: 1, background: `linear-gradient(135deg, ${currentMode?.color || '#ec4899'} 0%, ${currentMode?.color || '#ec4899'}dd 100%)` }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                {mode === 'images-to-pdf' ? 'Create PDF' : mode === 'rotate' ? 'Rotate PDF' : 'Add Numbers'}
              </>
            )}
          </button>

          {files.length > 0 && (
            <button onClick={handleClear} className="btn-secondary">
              Clear
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PDFConverter;
