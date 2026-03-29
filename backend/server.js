const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Import routes
const imageRoutes = require('./routes/imageRoutes');
const pdfRoutes = require('./routes/pdfRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Stats file path
const statsFile = path.join(__dirname, 'stats.json');

// Initialize stats
const initStats = () => {
  if (!fs.existsSync(statsFile)) {
    fs.writeFileSync(statsFile, JSON.stringify({
      totalConversions: 0,
      imageConversions: 0,
      pdfConversions: 0,
      imageCompressions: 0,
      pdfMerges: 0,
      pdfExtracts: 0,
      lastUpdated: new Date().toISOString()
    }));
  }
};

const getStats = () => {
  try {
    initStats();
    return JSON.parse(fs.readFileSync(statsFile, 'utf8'));
  } catch {
    return { totalConversions: 0, imageConversions: 0, pdfConversions: 0, imageCompressions: 0, pdfMerges: 0, pdfExtracts: 0 };
  }
};

const incrementStat = (type) => {
  try {
    const stats = getStats();
    stats.totalConversions = (stats.totalConversions || 0) + 1;
    if (type) {
      stats[type] = (stats[type] || 0) + 1;
    }
    stats.lastUpdated = new Date().toISOString();
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    return stats;
  } catch (err) {
    console.error('Error updating stats:', err);
  }
};

// Make stats functions available globally
global.getStats = getStats;
global.incrementStat = incrementStat;

// Initialize stats on startup
initStats();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads and output directories
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Serve static files from output directory
app.use('/output', express.static(outputDir));

// Download endpoint - forces file download instead of displaying in browser
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(outputDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('Download error:', err);
    }
  });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit per file
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'image/avif',
      'image/x-icon',
      'image/vnd.microsoft.icon',
      // PDF
      'application/pdf'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Make upload middleware available to routes
app.use((req, res, next) => {
  req.upload = upload;
  req.uploadsDir = uploadsDir;
  req.outputDir = outputDir;
  next();
});

// Routes
app.use('/api/image', imageRoutes);
app.use('/api/pdf', pdfRoutes);

// Stats endpoint
app.get('/api/stats', (req, res) => {
  const stats = getStats();
  res.json(stats);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Cleanup old files periodically (every hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  
  [uploadsDir, outputDir].forEach(dir => {
    fs.readdir(dir, (err, files) => {
      if (err) return;
      files.forEach(file => {
        const filePath = path.join(dir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          if (stats.mtimeMs < oneHourAgo) {
            fs.unlink(filePath, () => {});
          }
        });
      });
    });
  });
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
