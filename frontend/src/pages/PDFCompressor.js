import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wrench, Coffee, Rocket, ArrowLeft, Sparkles, Heart } from 'lucide-react';

const PDFCompressor = () => {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--background)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: 'center',
          maxWidth: '600px',
        }}
      >
        {/* Animated Icon */}
        <motion.div
          animate={{
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
          }}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
            boxShadow: '0 20px 60px rgba(245, 158, 11, 0.3)',
          }}
        >
          <Wrench size={50} color="white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
          }}
        >
          Coming Soon! 🚀
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: '1.25rem',
            color: 'var(--text-secondary)',
            marginBottom: '32px',
            lineHeight: '1.6',
          }}
        >
          Our PDF Compressor is currently getting a makeover! 
          <br />
          We're brewing something amazing for you.
        </motion.p>

        {/* Fun Message Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid var(--border-color)',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <Coffee size={24} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text)' }}>
              While you wait...
            </span>
            <Coffee size={24} style={{ color: '#f59e0b' }} />
          </div>
          
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1rem' }}>
            Our developers are working hard (and drinking lots of coffee ☕) 
            to bring you the best PDF compression experience. 
            <br /><br />
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Heart size={18} style={{ color: '#ef4444' }} />
              <span>Thanks for your patience!</span>
              <Heart size={18} style={{ color: '#ef4444' }} />
            </span>
          </p>
        </motion.div>

        {/* Features Coming */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          {['Smart Compression', 'Quality Presets', 'Batch Processing', 'Lightning Fast'].map((feature, index) => (
            <motion.span
              key={feature}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                borderRadius: '20px',
                fontSize: '0.9rem',
                color: 'var(--text)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={14} style={{ color: '#6366f1' }} />
              {feature}
            </motion.span>
          ))}
        </motion.div>

        {/* Back Button */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
            }}
          >
            <ArrowLeft size={20} />
            Back to Home
          </motion.button>
        </Link>

        {/* Animated Rocket */}
        <motion.div
          animate={{
            y: [-10, 10, -10],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            marginTop: '48px',
            opacity: 0.5,
          }}
        >
          <Rocket size={40} style={{ color: 'var(--text-secondary)' }} />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PDFCompressor;
