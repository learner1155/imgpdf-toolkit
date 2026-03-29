# ImgPDF - Image & PDF Toolkit

A modern, secure web application for converting, merging, extracting, and processing PDF and image files. Built with React 18 and Express.js.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

| Tool | Description |
|------|-------------|
| **Image Converter** | Convert between PNG, JPG, WebP, GIF, BMP, TIFF. Batch support, adjustable quality, resize during conversion. |
| **Image Compressor** | Reduce image file size (PNG, JPG, WebP) while preserving quality. Visual compression savings feedback. |
| **PDF Merger** | Combine multiple PDFs into one. Drag-and-drop reordering, page count preview. |
| **PDF Extractor** | Extract specific pages or split PDFs. Supports page ranges (e.g., 1, 3, 5-10). |
| **PDF Converter** | Convert images to PDF, rotate pages (90°/180°/270°), add page numbers. Multiple page sizes (A4, Letter, Legal). |

---

## Getting Started

### Prerequisites

- **Node.js** 16+
- **npm** or **yarn**
- **Ghostscript** (optional — enables advanced PDF compression)

### Installation

```bash
# Install all dependencies (backend + frontend)
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Running the Application

#### Option A — Start both together (recommended)

Open a terminal in the **project root folder** and run:

```bash
npm start
```

This starts the backend and frontend simultaneously using `concurrently`.

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000` (opens automatically in browser)

#### Option B — Start separately

Open **two separate terminals**:

```bash
# Terminal 1 — Backend
cd backend
npm start
```

```bash
# Terminal 2 — Frontend
cd frontend
npm start
```

---

### Restarting the Application

#### Restart both (Option A)

Press **Ctrl + C** in the terminal where `npm start` is running, then run it again:

```bash
npm start
```

#### Restart backend only

Press **Ctrl + C** in the backend terminal, then:

```bash
cd backend
npm start
```

#### Restart frontend only

Press **Ctrl + C** in the frontend terminal, then:

```bash
cd frontend
npm start
```

> **Tip:** Any time you change a backend file (e.g. `server.js`, routes), you must restart the backend. The frontend hot-reloads automatically on file changes and rarely needs a manual restart.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `REACT_APP_API_URL` | `http://localhost:5000` | Frontend API base URL |

---

## Dependencies

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| express | 4.18.2 | Web server framework |
| helmet | ^7.1.0 | HTTP security headers |
| express-rate-limit | ^7.1.5 | API rate limiting |
| cors | 2.8.5 | Cross-origin resource sharing |
| multer | 1.4.5-lts.1 | File upload handling |
| sharp | 0.33.1 | Image processing (convert, compress, resize) |
| pdf-lib | 1.17.1 | PDF manipulation (merge, split, extract, rotate) |
| uuid | 9.0.0 | Unique filename generation |

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.2.0 | UI library |
| react-dom | ^18.2.0 | React DOM renderer |
| react-router-dom | ^6.20.0 | Client-side routing |
| axios | ^1.6.2 | HTTP client for API calls |
| framer-motion | ^10.16.5 | Animations and transitions |
| react-dropzone | ^14.2.3 | Drag-and-drop file uploads |
| react-hot-toast | ^2.4.1 | Toast notifications |
| lucide-react | ^0.294.0 | Icon library |

### Root

| Package | Version | Purpose |
|---------|---------|---------|
| concurrently | ^8.2.2 | Run backend + frontend simultaneously |

---

## Security

| Measure | Details |
|---------|---------|
| **Helmet** | Sets secure HTTP headers (CSP, X-Frame-Options, HSTS, etc.) |
| **Rate Limiting** | 100 requests per minute per IP via express-rate-limit |
| **CORS Restriction** | Only configured origins allowed (default: `http://localhost:3000`) |
| **File Size Limit** | Maximum 50 MB per upload |
| **Filename Sanitization** | Strips special characters from uploaded filenames |
| **Path Traversal Protection** | Download endpoint validates filenames against directory traversal |
| **Auto Cleanup** | Uploaded and output files deleted every 30 minutes |
| **No External Data Sharing** | All processing happens locally on the server |
| **Allowed File Types** | Backend validates file extensions and MIME types |

---

## Project Structure

```
├── backend/
│   ├── routes/
│   │   ├── imageRoutes.js    # Image convert, compress, resize, info
│   │   └── pdfRoutes.js      # PDF merge, split, extract, rotate, page numbers
│   ├── uploads/              # Temporary upload storage (auto-cleaned)
│   ├── output/               # Processed file output (auto-cleaned)
│   ├── server.js             # Express server, middleware, security
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileDropzone.js   # Reusable drag-and-drop upload
│   │   │   ├── Navbar.js         # Navigation bar with theme toggle
│   │   │   └── ProgressBar.js    # Upload/processing progress
│   │   ├── config/
│   │   │   └── api.js            # Centralized API URL config
│   │   ├── context/
│   │   │   └── ThemeContext.js    # Dark/light theme provider
│   │   ├── pages/
│   │   │   ├── Home.js           # Landing page with feature cards
│   │   │   ├── ImageCompressor.js
│   │   │   ├── ImageConverter.js
│   │   │   ├── PDFConverter.js
│   │   │   ├── PDFExtractor.js
│   │   │   └── PDFMerger.js
│   │   ├── App.js                # Router and layout
│   │   ├── index.css             # Global styles
│   │   └── index.js              # Entry point
│   └── package.json
│
├── .gitignore
├── package.json                  # Root — concurrently script
└── README.md
```

---

## API Endpoints

### Image Routes (`/api/image`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/convert` | Convert a single image to target format |
| POST | `/batch-convert` | Convert multiple images at once |
| POST | `/compress` | Compress image with quality control |
| POST | `/resize` | Resize image to specified dimensions |
| POST | `/info` | Get image metadata (dimensions, format, size) |

### PDF Routes (`/api/pdf`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/compress` | Compress PDF (Ghostscript or pdf-lib fallback) |
| POST | `/merge` | Merge multiple PDFs into one |
| POST | `/split` | Split PDF into individual pages |
| POST | `/extract` | Extract specific pages by range |
| POST | `/rotate` | Rotate all pages by specified angle |
| POST | `/add-page-numbers` | Add page numbers with position/format options |
| POST | `/images-to-pdf` | Convert images to a multi-page PDF |
| POST | `/info` | Get PDF metadata (pages, title, author, size) |

### Download

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/download/:filename` | Download a processed file from output/ |

---

## UI Features

- Dark theme with glassmorphism effects
- Smooth Framer Motion animations
- Responsive design for all screen sizes
- Drag-and-drop file uploads
- Real-time progress indicators
- Toast notifications for feedback

---

## License

This project is licensed under the MIT License.
