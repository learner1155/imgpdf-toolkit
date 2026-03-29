import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  FileImage, 
  Merge, 
  Scissors, 
  RefreshCw,
  Minimize2,
  Home,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/image-converter', label: 'Image Converter', icon: FileImage },
    { path: '/image-compressor', label: 'Compressor', icon: Minimize2 },
    { path: '/pdf-merger', label: 'PDF Merger', icon: Merge },
    { path: '/pdf-extractor', label: 'PDF Extractor', icon: Scissors },
    { path: '/pdf-converter', label: 'PDF Converter', icon: RefreshCw },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '16px 24px',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textDecoration: 'none',
        }}>
          <motion.div
            whileHover={{ scale: 1.08, rotate: 4 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.55)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="nlg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4F46E5"/>
                  <stop offset="0.5" stopColor="#EC4899"/>
                  <stop offset="1" stopColor="#F59E0B"/>
                </linearGradient>
              </defs>
              {/* Background */}
              <rect width="44" height="44" rx="12" fill="url(#nlg)"/>
              {/* Document card — rotated, peeking from top-right */}
              <g opacity="0.75" transform="translate(22 3) rotate(12)">
                <rect width="14" height="18" rx="3" fill="white"/>
                <path d="M10 0 L14 4 H10 Z" fill="rgba(236,72,153,0.5)"/>
                <rect x="2.5" y="7" width="9" height="1.5" rx="0.75" fill="rgba(99,102,241,0.8)"/>
                <rect x="2.5" y="10.5" width="7" height="1.5" rx="0.75" fill="rgba(99,102,241,0.55)"/>
                <rect x="2.5" y="14" width="8" height="1.5" rx="0.75" fill="rgba(99,102,241,0.35)"/>
              </g>
              {/* Photo frame — front left */}
              <rect x="4" y="17" width="26" height="22" rx="4" fill="white"/>
              {/* Sun */}
              <circle cx="10" cy="23" r="3" fill="#F59E0B"/>
              {/* Mountains */}
              <path d="M4 39 L13 27 L18 33 L23 27 L30 39Z" fill="#6366F1" fillOpacity="0.62"/>
              {/* Frame inner highlight */}
              <rect x="4" y="17" width="26" height="22" rx="4" fill="none" stroke="white" strokeWidth="0.75" strokeOpacity="0.4"/>
            </svg>
          </motion.div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <span style={{
              fontSize: '22px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: '1.1',
              letterSpacing: '-0.5px',
            }}>
              ImgPDF
            </span>
            <span style={{
              fontSize: '10px',
              color: 'var(--text-secondary)',
              fontWeight: '500',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              Image & PDF Tools
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }} className="desktop-nav">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="nav-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isActive(link.path) ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: isActive(link.path) ? 'var(--text)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={16} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{link.label}</span>
              </Link>
            );
          })}
          
          {/* Theme Toggle Button */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(99, 102, 241, 0.1)',
              border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
              cursor: 'pointer',
              color: isDark ? '#fbbf24' : '#6366f1',
              marginLeft: '8px',
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
        </div>

        {/* Mobile Menu Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="mobile-controls">
          {/* Mobile Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(99, 102, 241, 0.1)',
              border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
              cursor: 'pointer',
              color: isDark ? '#fbbf24' : '#6366f1',
            }}
            className="mobile-theme-btn"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              cursor: 'pointer',
              padding: '8px',
            }}
            className="mobile-menu-btn"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: 'hidden',
              background: 'var(--surface)',
              borderRadius: '12px',
              marginTop: '16px',
            }}
            className="mobile-nav"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 20px',
                    color: isActive(link.path) ? 'var(--primary)' : 'var(--text)',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
                  }}
                >
                  <Icon size={20} />
                  <span style={{ fontWeight: '500' }}>{link.label}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-theme-btn {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
