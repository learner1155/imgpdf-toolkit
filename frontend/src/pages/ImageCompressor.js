import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Minimize2, Settings, TrendingDown } from 'lucide-react';
import axios from 'axios';
import FileDropzone from '../components/FileDropzone';
import ProgressBar from '../components/ProgressBar';
import API_URL from '../config/api';

const ImageCompressor = () => {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(70);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesSelected = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompress = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const compressedResults = [];

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('image', files[i]);
        formData.append('quality', quality.toString());

        const response = await axios.post(`${API_URL}/api/image/compress`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        compressedResults.push({
          originalName: files[i].name,
          ...response.data
        });

        setProgress(((i + 1) / files.length) * 100);
      }

      toast.success(`${compressedResults.length} image${compressedResults.length > 1 ? 's' : ''} compressed! Downloading...`);

      compressedResults.forEach((result, index) => {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = `${API_URL}/download/${result.filename}`;
          link.download = result.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 500);
      });

      setFiles([]);
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        toast.error('Cannot connect to server. Make sure the backend is running on port 5000.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to compress image');
      }
    } finally {
      setLoading(false);
      setProgress(0);
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
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Minimize2 size={24} color="#22c55e" />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Image Compressor</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Reduce image file size while maintaining visual quality
          </p>
        </div>

        {/* Main Content */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            accept={{
              'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.tiff', '.tif', '.avif']
            }}
            files={files}
            onRemoveFile={handleRemoveFile}
            title="Drop images here"
            subtitle="PNG, JPG, WebP, TIFF, AVIF supported"
          />

          {loading && <ProgressBar progress={progress} status="Compressing images..." />}
        </div>

        {/* Settings */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}>
            <Settings size={20} color="#22c55e" />
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Compression Settings</h3>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: 'var(--text-secondary)',
            }}>
              Quality Level ({quality}%)
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#22c55e',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginTop: '4px',
            }}>
              <span>Smaller file size</span>
              <span>Better quality</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleCompress}
            disabled={loading || files.length === 0}
            className="btn-primary"
            style={{ flex: 1, background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
                Compressing...
              </>
            ) : (
              <>
                <TrendingDown size={20} />
                Compress & Download {files.length > 0 ? `(${files.length})` : ''}
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

export default ImageCompressor;
