import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileImage, 
  Merge, 
  Scissors, 
  RefreshCw, 
  Minimize2, 
  ArrowRight,
  Sparkles,
  Zap,
  Shield
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      path: '/image-converter',
      icon: FileImage,
      title: 'Image Converter',
      description: 'Convert images between PNG, JPG, WebP, GIF, BMP, and TIFF formats',
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    },
    {
      path: '/image-compressor',
      icon: Minimize2,
      title: 'Image Compressor',
      description: 'Reduce image file size while maintaining quality',
      color: '#22c55e',
      gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    },
    {
      path: '/pdf-merger',
      icon: Merge,
      title: 'PDF Merger',
      description: 'Combine multiple PDF files into a single document',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
    {
      path: '/pdf-extractor',
      icon: Scissors,
      title: 'PDF Extractor',
      description: 'Extract specific pages from PDF files',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    },
    {
      path: '/pdf-converter',
      icon: RefreshCw,
      title: 'PDF Converter',
      description: 'Convert images to PDF or split PDF into pages',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process your files in seconds with our optimized algorithms',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Files are processed locally and automatically deleted after 1 hour',
    },
    {
      icon: Sparkles,
      title: 'High Quality',
      description: 'Maintain the best quality while converting or compressing',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)' }}>
      {/* Hero Section */}
      <section style={{
        padding: '60px 24px 40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Gradient */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '20px',
            padding: '8px 16px',
            marginBottom: '24px',
          }}>
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '500' }}>
              Free & Open Source
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: '800',
            marginBottom: '24px',
            lineHeight: '1.1',
          }}>
            <span style={{ color: 'var(--text)' }}>All-in-One </span>
            <span style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Images & PDF
            </span>
            <br />
            <span style={{ color: 'var(--text)' }}>Toolkit</span>
          </h1>

          <p style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto 40px',
            lineHeight: '1.6',
          }}>
            Convert, compress, merge, and extract your files with ease. 
            Fast, secure, and completely free to use.
          </p>

          <Link
            to="/image-converter"
            className="btn-primary"
            style={{
              fontSize: '16px',
              padding: '16px 32px',
            }}
          >
            Get Started
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '40px 24px 80px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.path} variants={itemVariants}>
                <Link to={feature.path} style={{ textDecoration: 'none' }}>
                  <div className="feature-card">
                    <div className="icon" style={{
                      background: `linear-gradient(135deg, ${feature.color}33 0%, ${feature.color}1a 100%)`,
                    }}>
                      <Icon size={28} color={feature.color} />
                    </div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: 'var(--text)',
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                    }}>
                      {feature.description}
                    </p>
                    <div style={{
                      marginTop: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: feature.color,
                      fontSize: '14px',
                      fontWeight: '500',
                    }}>
                      <span>Try it now</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section style={{
        padding: '60px 24px 80px',
        background: 'var(--surface)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '48px' }}
          >
            <h2 style={{
              fontSize: '32px',
              fontWeight: '700',
              marginBottom: '16px',
            }}>
              Why Choose Us?
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              maxWidth: '500px',
              margin: '0 auto',
            }}>
              Built with modern technology for the best user experience
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '32px',
          }}>
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}>
                    <Icon size={28} color="var(--primary)" />
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}>
                    {benefit.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5',
                  }}>
                    {benefit.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px 24px',
        textAlign: 'center',
        borderTop: '1px solid rgba(99, 102, 241, 0.1)',
      }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          © 2026 ImgPDF. Built with ❤️ using React & Node.js
        </p>
      </footer>
    </div>
  );
};

export default Home;
