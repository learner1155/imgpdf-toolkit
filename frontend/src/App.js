import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ImageConverter from './pages/ImageConverter';
import PDFMerger from './pages/PDFMerger';
import PDFExtractor from './pages/PDFExtractor';
import PDFConverter from './pages/PDFConverter';
import ImageCompressor from './pages/ImageCompressor';
import PDFCompressor from './pages/PDFCompressor';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen" style={{ background: 'var(--background)' }}>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--surface)',
                color: 'var(--text)',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--success)',
                  secondary: 'var(--text)',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--error)',
                  secondary: 'var(--text)',
                },
              },
            }}
          />
          <Navbar />
          <main style={{ paddingTop: '80px' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/image-converter" element={<ImageConverter />} />
              <Route path="/image-compressor" element={<ImageCompressor />} />
              <Route path="/pdf-merger" element={<PDFMerger />} />
              <Route path="/pdf-extractor" element={<PDFExtractor />} />
              <Route path="/pdf-converter" element={<PDFConverter />} />
              <Route path="/pdf-compressor" element={<PDFCompressor />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
