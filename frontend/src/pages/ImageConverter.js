import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FileImage, RefreshCw, Settings } from 'lucide-react';
import axios from 'axios';
import FileDropzone from '../components/FileDropzone';
import ProgressBar from '../components/ProgressBar';
import API_URL from '../config/api';

const ImageConverter = () => {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(90);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const formats = [
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPEG' },
    { value: 'webp', label: 'WebP' },
    { value: 'gif', label: 'GIF' },
    { value: 'bmp', label: 'BMP' },
    { value: 'tiff', label: 'TIFF' },
    { value: 'avif', label: 'AVIF' },
    { value: 'ico', label: 'ICO' },
    { value: 'svg', label: 'SVG' },
  ];

  const handleFilesSelected = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      if (files.length === 1) {
        // Single file conversion
        const formData = new FormData();
        formData.append('image', files[0]);
        formData.append('format', format);
        formData.append('quality', quality.toString());
        if (width) formData.append('width', width);
        if (height) formData.append('height', height);

        const response = await axios.post(`${API_URL}/api/image/convert`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted * 0.5);
          },
        });

        setProgress(100);
        toast.success('Image converted successfully!');
        
        // Auto download
        const link = document.createElement('a');
        link.href = `${API_URL}/download/${response.data.filename}`;
        link.download = response.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clear files after download
        setFiles([]);
      } else {
        // Batch conversion
        const formData = new FormData();
        files.forEach(file => formData.append('images', file));
        formData.append('format', format);
        formData.append('quality', quality.toString());

        const response = await axios.post(`${API_URL}/api/image/batch-convert`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted * 0.5);
          },
        });

        setProgress(100);
        toast.success(`${response.data.files.length} images converted successfully!`);
        
        // Auto download all files
        response.data.files.forEach((file, index) => {
          setTimeout(() => {
            const link = document.createElement('a');
            link.href = `${API_URL}/download/${file.filename}`;
            link.download = file.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, index * 500);
        });
        
        // Clear files after download
        setFiles([]);
      }
    } catch (error) {
      console.error('Error converting image:', error);
      if (error.code === 'ERR_NETWORK' || !error.response) {
        toast.error('Cannot connect to server. Make sure the backend is running on port 5000.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to convert image');
      }
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
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FileImage size={24} color="var(--primary)" />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Image Converter</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Convert images between PNG, JPG, WebP, GIF, BMP, TIFF, AVIF, ICO, and SVG formats
          </p>
        </div>

        {/* Main Content */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            accept={{
              'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.avif', '.ico', '.svg']
            }}
            files={files}
            onRemoveFile={handleRemoveFile}
            title="Drop images here"
            subtitle="PNG, JPG, WebP, GIF, BMP, TIFF, AVIF, ICO, SVG supported"
          />

          {loading && <ProgressBar progress={progress} status="Converting images..." />}
        </div>

        {/* Settings */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '20px',
          }}>
            <Settings size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Conversion Settings</h3>
          </div>

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
                Output Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="select-field"
              >
                {formats.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
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
                {(format === 'png' || format === 'gif' || format === 'ico' || format === 'bmp' || format === 'svg') ? 'Quality (N/A)' : `Quality (${quality}%)`}
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                disabled={format === 'gif' || format === 'png' || format === 'ico' || format === 'bmp' || format === 'svg'}
                style={{
                  width: '100%',
                  accentColor: 'var(--primary)',
                  opacity: (format === 'gif' || format === 'png' || format === 'ico' || format === 'bmp' || format === 'svg') ? 0.5 : 1,
                }}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {(format === 'png' || format === 'gif' || format === 'ico' || format === 'svg') ? 'This format does not support quality settings' :
                 'Lower = smaller file, higher = better quality'}
              </p>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                marginBottom: '8px',
                color: 'var(--text-secondary)',
              }}>
                Width (px)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="Auto"
                className="input-field"
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                marginBottom: '8px',
                color: 'var(--text-secondary)',
              }}>
                Height (px)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Auto"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleConvert}
            disabled={loading || files.length === 0}
            className="btn-primary"
            style={{ flex: 1 }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
                Converting...
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                Convert & Download {files.length > 0 ? `(${files.length})` : ''}
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

export default ImageConverter;
