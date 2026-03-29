import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Scissors, Download, FileText, Settings } from 'lucide-react';
import axios from 'axios';
import FileDropzone from '../components/FileDropzone';
import ProgressBar from '../components/ProgressBar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PDFExtractor = () => {
  const [files, setFiles] = useState([]);
  const [pages, setPages] = useState('');
  const [mode, setMode] = useState('extract'); // 'extract' or 'split'
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [pdfInfo, setPdfInfo] = useState(null);

  const handleFilesSelected = async (newFiles) => {
    if (newFiles.length > 0) {
      setFiles([newFiles[0]]);
      setResult(null);
      setPdfInfo(null);

      // Get PDF info
      try {
        const formData = new FormData();
        formData.append('pdf', newFiles[0]);
        const response = await axios.post(`${API_URL}/api/pdf/info`, formData);
        setPdfInfo(response.data.info);
      } catch (error) {
        console.error('Error getting PDF info:', error);
      }
    }
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setPdfInfo(null);
    setResult(null);
  };

  const handleExtract = async () => {
    if (files.length === 0) {
      toast.error('Please select a PDF file');
      return;
    }

    if (mode === 'extract' && !pages.trim()) {
      toast.error('Please specify pages to extract');
      return;
    }

    setLoading(true);
    setProgress(0);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('pdf', files[0]);

      const endpoint = mode === 'split' ? '/api/pdf/split' : '/api/pdf/extract';
      if (mode === 'extract') {
        formData.append('pages', pages);
      }

      const response = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted * 0.8);
        },
      });

      setProgress(100);
      setResult(response.data);
      toast.success(mode === 'split' ? 'PDF split successfully!' : 'Pages extracted successfully!');
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast.error(error.response?.data?.error || 'Failed to process PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (filename) => {
    const link = document.createElement('a');
    link.href = `${API_URL}/download/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    if (!result?.files) return;
    result.files.forEach((file, index) => {
      setTimeout(() => {
        handleDownload(file.filename);
      }, index * 500);
    });
  };

  const handleClear = () => {
    setFiles([]);
    setResult(null);
    setPdfInfo(null);
    setProgress(0);
    setPages('');
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
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Scissors size={24} color="#ef4444" />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>PDF Extractor</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Extract specific pages or split PDF into individual pages
          </p>
        </div>

        {/* Mode Selection */}
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setMode('extract')}
              style={{
                flex: 1,
                padding: '16px',
                background: mode === 'extract' ? 'rgba(239, 68, 68, 0.2)' : 'var(--surface)',
                border: mode === 'extract' ? '2px solid #ef4444' : '2px solid transparent',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              <FileText size={24} color={mode === 'extract' ? '#ef4444' : 'var(--text-secondary)'} style={{ marginBottom: '8px' }} />
              <p style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: mode === 'extract' ? 'var(--text)' : 'var(--text-secondary)',
              }}>
                Extract Pages
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Select specific pages
              </p>
            </button>
            <button
              onClick={() => setMode('split')}
              style={{
                flex: 1,
                padding: '16px',
                background: mode === 'split' ? 'rgba(239, 68, 68, 0.2)' : 'var(--surface)',
                border: mode === 'split' ? '2px solid #ef4444' : '2px solid transparent',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              <Scissors size={24} color={mode === 'split' ? '#ef4444' : 'var(--text-secondary)'} style={{ marginBottom: '8px' }} />
              <p style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: mode === 'split' ? 'var(--text)' : 'var(--text-secondary)',
              }}>
                Split All Pages
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                One page per file
              </p>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            accept={{
              'application/pdf': ['.pdf']
            }}
            multiple={false}
            files={files}
            onRemoveFile={handleRemoveFile}
            title="Drop PDF file here"
            subtitle="Select a PDF to extract pages from"
          />

          {loading && <ProgressBar progress={progress} status={mode === 'split' ? 'Splitting PDF...' : 'Extracting pages...'} />}
        </div>

        {/* PDF Info */}
        {pdfInfo && (
          <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '12px',
            }}>
              <FileText size={18} color="#ef4444" />
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>PDF Information</h3>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px',
            }}>
              <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Pages</p>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#ef4444' }}>{pdfInfo.pageCount}</p>
              </div>
              {pdfInfo.title && pdfInfo.title !== 'N/A' && (
                <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Title</p>
                  <p style={{ fontSize: '14px', fontWeight: '500' }}>{pdfInfo.title}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings for Extract Mode */}
        {mode === 'extract' && files.length > 0 && (
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '16px',
            }}>
              <Settings size={20} color="#ef4444" />
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Page Selection</h3>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                marginBottom: '8px',
                color: 'var(--text-secondary)',
              }}>
                Pages to Extract
              </label>
              <input
                type="text"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="e.g., 1, 3, 5-10, 15"
                className="input-field"
              />
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Use commas for individual pages and dashes for ranges. 
                {pdfInfo && ` (1-${pdfInfo.pageCount} available)`}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={handleExtract}
            disabled={loading || files.length === 0 || (mode === 'extract' && !pages.trim())}
            className="btn-primary"
            style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
                Processing...
              </>
            ) : (
              <>
                <Scissors size={20} />
                {mode === 'split' ? 'Split All Pages' : 'Extract Pages'}
              </>
            )}
          </button>

          {files.length > 0 && (
            <button onClick={handleClear} className="btn-secondary">
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: '24px' }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: 'var(--success)',
              }}>
                ✓ {mode === 'split' ? `Split into ${result.totalPages || result.files?.length} pages` : `Extracted ${result.pageCount || result.extractedPages?.length} pages`}
              </h3>
              {result.files && result.files.length > 1 && (
                <button
                  onClick={handleDownloadAll}
                  className="btn-secondary"
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  <Download size={14} />
                  Download All
                </button>
              )}
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}>
              {result.files ? (
                result.files.map((file, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '12px',
                      background: 'var(--surface)',
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>Page {file.page}</span>
                    <button
                      onClick={() => handleDownload(file.filename)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: '#ef4444',
                        fontWeight: '500',
                      }}
                    >
                      <Download size={12} />
                      Download
                    </button>
                  </div>
                ))
              ) : (
                <div 
                  style={{
                    padding: '16px',
                    background: 'var(--surface)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gridColumn: '1 / -1',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>{result.filename}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Pages: {result.extractedPages?.join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(result.filename)}
                    className="btn-primary"
                    style={{ 
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    }}
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PDFExtractor;
