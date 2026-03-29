const express = require('express');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const imageRoutes = require('./routes/imageRoutes');
const pdfRoutes = require('./routes/pdfRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, 'uploads');
const outputDir  = path.join(__dirname, 'output');
[uploadsDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Rate limiting: 100 requests per minute per IP
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uuidv4()}-${safeName}`);
  },
});

const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/bmp', 'image/tiff', 'image/avif',
  'image/x-icon', 'image/vnd.microsoft.icon',
  'application/pdf',
]);

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' is not allowed`), false);
    }
  },
});

app.use((req, res, next) => {
  req.upload = upload;
  req.uploadsDir = uploadsDir;
  req.outputDir = outputDir;
  next();
});

// Static files & download
app.use('/output', express.static(outputDir));

app.get('/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.resolve(outputDir, filename);

  // Path traversal protection
  if (!filePath.startsWith(path.resolve(outputDir))) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath, filename, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  });
});

// Routes
app.use('/api/image', imageRoutes);
app.use('/api/pdf', pdfRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend build in production
const frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Cleanup old files every 30 minutes
setInterval(() => {
  const maxAge = Date.now() - 30 * 60 * 1000;
  [uploadsDir, outputDir].forEach(dir => {
    fs.readdir(dir, (err, files) => {
      if (err) return;
      files.forEach(file => {
        const filePath = path.join(dir, file);
        fs.stat(filePath, (err, stats) => {
          if (!err && stats.mtimeMs < maxAge) {
            fs.unlink(filePath, () => {});
          }
        });
      });
    });
  });
}, 30 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
