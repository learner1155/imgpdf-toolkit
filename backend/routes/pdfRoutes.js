const express = require('express');
const router = express.Router();
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { execSync } = require('child_process');

// Check if Ghostscript is available
function isGhostscriptAvailable() {
  try {
    execSync('gswin64c --version', { stdio: 'ignore' });
    return 'gswin64c';
  } catch {
    try {
      execSync('gswin32c --version', { stdio: 'ignore' });
      return 'gswin32c';
    } catch {
      try {
        execSync('gs --version', { stdio: 'ignore' });
        return 'gs';
      } catch {
        return null;
      }
    }
  }
}

// Compress PDF using Ghostscript if available
async function compressPdfWithGhostscript(inputPath, outputPath, quality = 'ebook') {
  const gs = isGhostscriptAvailable();
  if (!gs) return false;
  
  // Quality settings: screen (72dpi), ebook (150dpi), printer (300dpi), prepress (300dpi, color preserving)
  const validQualities = ['screen', 'ebook', 'printer', 'prepress'];
  const pdfSettings = validQualities.includes(quality) ? quality : 'ebook';
  
  try {
    execSync(`${gs} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${pdfSettings} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`, {
      stdio: 'ignore',
      timeout: 120000 // 2 minute timeout
    });
    return true;
  } catch {
    return false;
  }
}

// Compress PDF endpoint
router.post('/compress', (req, res, next) => {
  req.upload.single('pdf')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file provided' });
      }

      const { quality } = req.body; // screen, ebook, printer, prepress
      const compressionQuality = quality || 'ebook';
      const originalSize = req.file.size;
      
      const outputFileName = `${uuidv4()}-compressed.pdf`;
      const outputPath = path.join(req.outputDir, outputFileName);
      
      // Try Ghostscript compression first
      const gsCompressed = await compressPdfWithGhostscript(req.file.path, outputPath, compressionQuality);
      
      if (gsCompressed && fs.existsSync(outputPath)) {
        const compressedSize = fs.statSync(outputPath).size;
        
        // Clean up input file
        fs.unlinkSync(req.file.path);
        
        res.json({
          success: true,
          filename: outputFileName,
          downloadUrl: `/output/${outputFileName}`,
          originalSize,
          compressedSize,
          reduction: Math.round((1 - compressedSize / originalSize) * 100) + '%',
          method: 'ghostscript'
        });
      } else {
        // Fallback: use pdf-lib with optimization (limited compression)
        const pdfBytes = fs.readFileSync(req.file.path);
        const pdf = await PDFDocument.load(pdfBytes, { 
          ignoreEncryption: true,
          updateMetadata: false
        });
        
        // Create optimized copy
        const newPdf = await PDFDocument.create();
        newPdf.setTitle('');
        newPdf.setAuthor('');
        newPdf.setSubject('');
        newPdf.setKeywords([]);
        newPdf.setProducer('');
        newPdf.setCreator('');
        
        const copiedPages = await newPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const newPdfBytes = await newPdf.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 50
        });
        
        fs.writeFileSync(outputPath, newPdfBytes);
        
        // Clean up input file
        fs.unlinkSync(req.file.path);
        
        const compressedSize = newPdfBytes.length;
        
        res.json({
          success: true,
          filename: outputFileName,
          downloadUrl: `/output/${outputFileName}`,
          originalSize,
          compressedSize,
          reduction: Math.round((1 - compressedSize / originalSize) * 100) + '%',
          method: 'pdf-lib',
          note: 'For better compression, install Ghostscript on your system'
        });
      }
    } catch (error) {
      next(error);
    }
  });
});

// Merge PDFs
router.post('/merge', (req, res, next) => {
  req.upload.array('pdfs', 20)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.files || req.files.length < 2) {
        return res.status(400).json({ error: 'At least 2 PDF files are required' });
      }

      const mergedPdf = await PDFDocument.create();

      // Sort files by order if provided
      let orderedFiles = req.files;
      if (req.body.order) {
        const order = JSON.parse(req.body.order);
        orderedFiles = order.map(idx => req.files[idx]);
      }

      for (const file of orderedFiles) {
        const pdfBytes = fs.readFileSync(file.path);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const outputFileName = `${uuidv4()}-merged.pdf`;
      const outputPath = path.join(req.outputDir, outputFileName);
      
      fs.writeFileSync(outputPath, mergedPdfBytes);

      // Clean up input files
      req.files.forEach(file => fs.unlinkSync(file.path));

      // Increment stats
      if (global.incrementStat) {
        global.incrementStat('pdfMerges');
      }

      res.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`,
        pageCount: mergedPdf.getPageCount()
      });
    } catch (error) {
      next(error);
    }
  });
});

// Split PDF
router.post('/split', (req, res, next) => {
  req.upload.single('pdf')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file provided' });
      }

      const pdfBytes = fs.readFileSync(req.file.path);
      const pdf = await PDFDocument.load(pdfBytes, { 
        ignoreEncryption: true,
        updateMetadata: false
      });
      const pageCount = pdf.getPageCount();

      const results = [];

      for (let i = 0; i < pageCount; i++) {
        // Create a new PDF with minimal overhead
        const newPdf = await PDFDocument.create();
        
        // Remove metadata to reduce size
        newPdf.setTitle('');
        newPdf.setAuthor('');
        newPdf.setSubject('');
        newPdf.setKeywords([]);
        newPdf.setProducer('');
        newPdf.setCreator('');
        
        const [copiedPage] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(copiedPage);

        // Save with optimization options
        const newPdfBytes = await newPdf.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 100,
        });
        
        const outputFileName = `${uuidv4()}-page-${i + 1}.pdf`;
        const outputPath = path.join(req.outputDir, outputFileName);
        
        fs.writeFileSync(outputPath, newPdfBytes);
        
        results.push({
          page: i + 1,
          filename: outputFileName,
          downloadUrl: `/output/${outputFileName}`,
          size: newPdfBytes.length
        });
      }

      // Clean up input file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        totalPages: pageCount,
        files: results
      });
    } catch (error) {
      next(error);
    }
  });
});

// Extract specific pages from PDF
router.post('/extract', (req, res, next) => {
  req.upload.single('pdf')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file provided' });
      }

      const { pages } = req.body; // e.g., "1,3,5-7,10"
      if (!pages) {
        return res.status(400).json({ error: 'No pages specified' });
      }

      const pdfBytes = fs.readFileSync(req.file.path);
      const pdf = await PDFDocument.load(pdfBytes, { 
        ignoreEncryption: true,
        updateMetadata: false
      });
      const totalPages = pdf.getPageCount();

      // Parse page ranges
      const pageIndices = parsePageRanges(pages, totalPages);

      if (pageIndices.length === 0) {
        return res.status(400).json({ error: 'Invalid page selection' });
      }

      const newPdf = await PDFDocument.create();
      
      // Remove metadata to reduce size
      newPdf.setTitle('');
      newPdf.setAuthor('');
      newPdf.setSubject('');
      newPdf.setKeywords([]);
      newPdf.setProducer('');
      newPdf.setCreator('');
      
      const copiedPages = await newPdf.copyPages(pdf, pageIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      // Save with optimization options
      const newPdfBytes = await newPdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 100,
      });
      
      const outputFileName = `${uuidv4()}-extracted.pdf`;
      const outputPath = path.join(req.outputDir, outputFileName);
      
      fs.writeFileSync(outputPath, newPdfBytes);

      // Clean up input file
      fs.unlinkSync(req.file.path);

      // Increment stats
      if (global.incrementStat) {
        global.incrementStat('pdfExtracts');
      }

      res.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`,
        extractedPages: pageIndices.map(i => i + 1),
        pageCount: pageIndices.length,
        size: newPdfBytes.length
      });
    } catch (error) {
      next(error);
    }
  });
});

// Convert images to PDF
router.post('/images-to-pdf', (req, res, next) => {
  req.upload.array('images', 50)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No image files provided' });
      }

      const pdfDoc = await PDFDocument.create();
      const { pageSize, margin, alignment } = req.body;
      
      // Parse margin
      const marginSize = margin ? parseInt(margin) : 20;
      
      // Parse alignment (top, center, bottom)
      const verticalAlignment = alignment || 'center';
      
      // Page dimensions (default A4)
      let pageWidth = 595;
      let pageHeight = 842;
      
      if (pageSize === 'letter') {
        pageWidth = 612;
        pageHeight = 792;
      } else if (pageSize === 'legal') {
        pageWidth = 612;
        pageHeight = 1008;
      }

      // Sort files by order if provided
      let orderedFiles = req.files;
      if (req.body.order) {
        const order = JSON.parse(req.body.order);
        orderedFiles = order.map(idx => req.files[idx]);
      }

      for (const file of orderedFiles) {
        // Convert image to PNG using sharp for consistent handling
        const imageBuffer = await sharp(file.path)
          .png()
          .toBuffer();

        const image = await pdfDoc.embedPng(imageBuffer);
        const imageWidth = image.width;
        const imageHeight = image.height;

        // Calculate scaling to fit page with margin
        const availableWidth = pageWidth - (marginSize * 2);
        const availableHeight = pageHeight - (marginSize * 2);
        
        const scale = Math.min(
          availableWidth / imageWidth,
          availableHeight / imageHeight
        );

        const scaledWidth = imageWidth * scale;
        const scaledHeight = imageHeight * scale;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        
        // Center image horizontally
        const x = (pageWidth - scaledWidth) / 2;
        
        // Calculate y position based on alignment
        let y;
        if (verticalAlignment === 'top') {
          y = pageHeight - marginSize - scaledHeight;
        } else if (verticalAlignment === 'bottom') {
          y = marginSize;
        } else {
          // center (default)
          y = (pageHeight - scaledHeight) / 2;
        }

        page.drawImage(image, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight
        });
      }

      const pdfBytes = await pdfDoc.save();
      const outputFileName = `${uuidv4()}-images.pdf`;
      const outputPath = path.join(req.outputDir, outputFileName);
      
      fs.writeFileSync(outputPath, pdfBytes);

      // Clean up input files
      req.files.forEach(file => fs.unlinkSync(file.path));

      // Increment stats
      if (global.incrementStat) {
        global.incrementStat('pdfConversions');
      }

      res.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`,
        pageCount: pdfDoc.getPageCount()
      });
    } catch (error) {
      next(error);
    }
  });
});

// Convert PDF to images
router.post('/to-images', (req, res, next) => {
  req.upload.single('pdf')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file provided' });
      }

      const { format, quality, dpi } = req.body;
      const imageFormat = format || 'png';
      const imageQuality = quality ? parseInt(quality) : 90;
      const imageDpi = dpi ? parseInt(dpi) : 150;

      // For PDF to image conversion, we'll use pdf-lib to extract pages
      // and then render them. Since pdf-poppler may have issues on Windows,
      // we'll provide an alternative approach using PDF preview generation
      
      const pdfBytes = fs.readFileSync(req.file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      const pageCount = pdf.getPageCount();
      
      const results = [];
      
      // Note: Full PDF to image conversion requires additional tools like
      // pdf-poppler or pdf2pic. For now, we'll return page info and 
      // recommend using the split function for individual pages
      
      // Clean up
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: 'PDF analyzed successfully',
        pageCount: pageCount,
        note: 'For full PDF to image conversion, install pdf-poppler or use online tools. You can use the split function to extract individual pages.',
        pages: Array.from({ length: pageCount }, (_, i) => ({
          page: i + 1,
          status: 'available for extraction'
        }))
      });
    } catch (error) {
      next(error);
    }
  });
});

// Get PDF info
router.post('/info', (req, res, next) => {
  req.upload.single('pdf')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file provided' });
      }

      const pdfBytes = fs.readFileSync(req.file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      
      const pages = pdf.getPages();
      const pageInfo = pages.map((page, index) => ({
        page: index + 1,
        width: page.getWidth(),
        height: page.getHeight()
      }));

      // Clean up input file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        info: {
          pageCount: pdf.getPageCount(),
          title: pdf.getTitle() || 'N/A',
          author: pdf.getAuthor() || 'N/A',
          subject: pdf.getSubject() || 'N/A',
          creator: pdf.getCreator() || 'N/A',
          producer: pdf.getProducer() || 'N/A',
          creationDate: pdf.getCreationDate()?.toISOString() || 'N/A',
          modificationDate: pdf.getModificationDate()?.toISOString() || 'N/A',
          pages: pageInfo,
          fileSize: req.file.size
        }
      });
    } catch (error) {
      next(error);
    }
  });
});

// Rotate PDF pages
router.post('/rotate', (req, res, next) => {
  req.upload.single('pdf')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file provided' });
      }

      const { angle, pages } = req.body; // angle: 90, 180, 270
      const rotationAngle = parseInt(angle) || 90;

      const pdfBytes = fs.readFileSync(req.file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      const pdfPages = pdf.getPages();
      const totalPages = pdfPages.length;

      // Parse which pages to rotate (if not specified, rotate all)
      let pageIndices = pages 
        ? parsePageRanges(pages, totalPages)
        : Array.from({ length: totalPages }, (_, i) => i);

      pageIndices.forEach(index => {
        if (index >= 0 && index < totalPages) {
          const page = pdfPages[index];
          page.setRotation({ angle: rotationAngle, type: 'degrees' });
        }
      });

      const rotatedPdfBytes = await pdf.save();
      const outputFileName = `${uuidv4()}-rotated.pdf`;
      const outputPath = path.join(req.outputDir, outputFileName);
      
      fs.writeFileSync(outputPath, rotatedPdfBytes);

      // Clean up input file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`,
        rotatedPages: pageIndices.map(i => i + 1),
        angle: rotationAngle
      });
    } catch (error) {
      next(error);
    }
  });
});

// Add page numbers to PDF
router.post('/add-page-numbers', (req, res, next) => {
  req.upload.single('pdf')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file provided' });
      }

      const { position, startNumber, format: numberFormat } = req.body;
      const startNum = parseInt(startNumber) || 1;

      const pdfBytes = fs.readFileSync(req.file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();
      const font = await pdf.embedFont(StandardFonts.Helvetica);

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const pageNum = startNum + index;
        let text = `${pageNum}`;
        
        if (numberFormat === 'page-of-total') {
          text = `Page ${pageNum} of ${pages.length + startNum - 1}`;
        }

        const textWidth = font.widthOfTextAtSize(text, 12);
        
        let x, y;
        switch (position) {
          case 'top-left':
            x = 40;
            y = height - 30;
            break;
          case 'top-center':
            x = (width - textWidth) / 2;
            y = height - 30;
            break;
          case 'top-right':
            x = width - textWidth - 40;
            y = height - 30;
            break;
          case 'bottom-left':
            x = 40;
            y = 30;
            break;
          case 'bottom-right':
            x = width - textWidth - 40;
            y = 30;
            break;
          case 'bottom-center':
          default:
            x = (width - textWidth) / 2;
            y = 30;
            break;
        }

        page.drawText(text, {
          x,
          y,
          size: 12,
          font,
          color: rgb(0, 0, 0)
        });
      });

      const numberedPdfBytes = await pdf.save();
      const outputFileName = `${uuidv4()}-numbered.pdf`;
      const outputPath = path.join(req.outputDir, outputFileName);
      
      fs.writeFileSync(outputPath, numberedPdfBytes);

      // Clean up input file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`,
        pageCount: pages.length
      });
    } catch (error) {
      next(error);
    }
  });
});

// Helper function to parse page ranges
function parsePageRanges(rangeStr, totalPages) {
  const ranges = rangeStr.split(',');
  const pageIndices = new Set();

  ranges.forEach(range => {
    range = range.trim();
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(n => parseInt(n.trim()));
      for (let i = start; i <= end && i <= totalPages; i++) {
        if (i >= 1) pageIndices.add(i - 1);
      }
    } else {
      const page = parseInt(range);
      if (page >= 1 && page <= totalPages) {
        pageIndices.add(page - 1);
      }
    }
  });

  return Array.from(pageIndices).sort((a, b) => a - b);
}

module.exports = router;
