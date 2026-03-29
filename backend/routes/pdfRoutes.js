const express = require('express');
const router = express.Router();
const { PDFDocument, PDFName, rgb, StandardFonts } = require('pdf-lib');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { execSync } = require('child_process');

function isGhostscriptAvailable() {
  for (const cmd of ['gswin64c', 'gswin32c', 'gs']) {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore' });
      return cmd;
    } catch {}
  }
  return null;
}

async function compressPdfWithGhostscript(inputPath, outputPath, quality = 'ebook') {
  const gs = isGhostscriptAvailable();
  if (!gs) return false;

  const validQualities = ['screen', 'ebook', 'printer', 'prepress'];
  const pdfSettings = validQualities.includes(quality) ? quality : 'ebook';

  try {
    execSync(
      `${gs} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${pdfSettings} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`,
      { stdio: 'ignore', timeout: 120000 }
    );
    return true;
  } catch {
    return false;
  }
}

function parsePageRanges(rangeStr, totalPages) {
  const pageIndices = new Set();
  rangeStr.split(',').forEach(range => {
    range = range.trim();
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(n => parseInt(n.trim()));
      for (let i = start; i <= end && i <= totalPages; i++) {
        if (i >= 1) pageIndices.add(i - 1);
      }
    } else {
      const page = parseInt(range);
      if (page >= 1 && page <= totalPages) pageIndices.add(page - 1);
    }
  });
  return Array.from(pageIndices).sort((a, b) => a - b);
}

function stripMetadata(pdfDoc) {
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('');
  pdfDoc.setCreator('');
}

router.post('/compress', (req, res, next) => {
  req.upload.single('pdf')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF file provided' });

      const originalSize = req.file.size;
      const outputFileName = `${uuidv4()}-compressed.pdf`;
      const outputPath = path.join(req.outputDir, outputFileName);

      // Determine target from percentage or absolute KB
      const targetPercent = req.body.percentage ? parseInt(req.body.percentage) : null;
      const targetSizeKB = req.body.targetSizeKB ? parseInt(req.body.targetSizeKB) : null;
      let targetBytes = null;
      if (targetPercent && targetPercent > 0 && targetPercent < 100) {
        targetBytes = Math.round(originalSize * targetPercent / 100);
      } else if (targetSizeKB && targetSizeKB > 0) {
        targetBytes = targetSizeKB * 1024;
      }

      // Quality ladder from aggressive to light
      const qualityLevels = ['screen', 'ebook', 'printer', 'prepress'];
      const defaultQuality = req.body.quality || 'ebook';
      let bestPath = null;
      let bestSize = originalSize;
      let method = 'pdf-lib';

      const gs = isGhostscriptAvailable();
      if (gs) {
        if (targetBytes) {
          // Try each quality level until we get under the target
          for (const q of qualityLevels) {
            const tryPath = outputPath + `.try_${q}`;
            const ok = await compressPdfWithGhostscript(req.file.path, tryPath, q);
            if (ok && fs.existsSync(tryPath)) {
              const sz = fs.statSync(tryPath).size;
              if (sz <= targetBytes) {
                // Found a level that meets the target — pick the lightest one that fits
                if (!bestPath || sz > bestSize) {
                  if (bestPath) fs.unlinkSync(bestPath);
                  bestPath = tryPath;
                  bestSize = sz;
                } else {
                  fs.unlinkSync(tryPath);
                }
                // Keep going to find the least-aggressive level that still fits
              } else {
                // Doesn't fit target but might be the best so far
                if (!bestPath) {
                  bestPath = tryPath;
                  bestSize = sz;
                } else if (sz < bestSize) {
                  fs.unlinkSync(bestPath);
                  bestPath = tryPath;
                  bestSize = sz;
                } else {
                  fs.unlinkSync(tryPath);
                }
              }
            }
          }
          if (bestPath) {
            if (bestSize < originalSize) {
              fs.renameSync(bestPath, outputPath);
              method = 'ghostscript';
            } else {
              fs.unlinkSync(bestPath);
            }
          }
          // Clean up any remaining temp files
          qualityLevels.forEach(q => {
            const p = outputPath + `.try_${q}`;
            if (fs.existsSync(p)) fs.unlinkSync(p);
          });
        } else {
          // Simple single-quality compression
          const ok = await compressPdfWithGhostscript(req.file.path, outputPath, defaultQuality);
          if (ok && fs.existsSync(outputPath)) {
            const gsSize = fs.statSync(outputPath).size;
            if (gsSize < originalSize) {
              method = 'ghostscript';
            } else {
              fs.unlinkSync(outputPath);
            }
          }
        }
      }

      // Fallback: pdf-lib optimization with embedded image re-compression
      if (method !== 'ghostscript' || !fs.existsSync(outputPath)) {
        const pdfBytes = fs.readFileSync(req.file.path);
        const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

        // Determine JPEG re-compression quality based on target
        let imgQ = 50;
        if (targetBytes) {
          const ratio = targetBytes / originalSize;
          if (ratio < 0.3) imgQ = 20;
          else if (ratio < 0.5) imgQ = 35;
          else if (ratio < 0.7) imgQ = 50;
          else imgQ = 70;
        } else {
          imgQ = { screen: 30, ebook: 50, printer: 70, prepress: 85 }[defaultQuality] || 50;
        }

        // Re-compress embedded JPEG images
        let imagesOptimized = 0;
        try {
          for (const [ref, obj] of pdf.context.enumerateIndirectObjects()) {
            if (!obj || !obj.dict || !obj.contents) continue;
            const subtype = obj.dict.get(PDFName.of('Subtype'));
            const filter = obj.dict.get(PDFName.of('Filter'));
            if (subtype && subtype.toString() === '/Image' &&
                filter && filter.toString() === '/DCTDecode') {
              try {
                const jpegBuf = Buffer.from(obj.contents);
                if (jpegBuf.length > 10000) {
                  const smaller = await sharp(jpegBuf).jpeg({ quality: imgQ }).toBuffer();
                  if (smaller.length < jpegBuf.length * 0.9) {
                    obj.contents = new Uint8Array(smaller);
                    imagesOptimized++;
                  }
                }
              } catch {}
            }
          }
        } catch {}

        stripMetadata(pdf);
        const newPdfBytes = await pdf.save({ useObjectStreams: true });

        // Only use optimized version if actually smaller
        if (newPdfBytes.length < pdfBytes.length) {
          fs.writeFileSync(outputPath, newPdfBytes);
        } else {
          fs.copyFileSync(req.file.path, outputPath);
        }
        method = imagesOptimized > 0 ? 'pdf-lib+images' : 'pdf-lib';
      }

      const compressedSize = fs.statSync(outputPath).size;
      fs.unlinkSync(req.file.path);

      const result = {
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`,
        originalSize,
        compressedSize,
        reduction: Math.round((1 - compressedSize / originalSize) * 100) + '%',
        method,
      };
      if (method === 'pdf-lib' || method === 'pdf-lib+images') {
        result.note = 'For better compression, install Ghostscript on your system';
      }
      if (targetBytes && compressedSize > targetBytes) {
        result.warning = 'Could not reach the requested target size. This is the best compression available.';
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
});

router.post('/merge', (req, res, next) => {
  req.upload.array('pdfs', 20)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      if (!req.files || req.files.length < 2) {
        return res.status(400).json({ error: 'At least 2 PDF files are required' });
      }

      const mergedPdf = await PDFDocument.create();

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
      req.files.forEach(file => fs.unlinkSync(file.path));

      res.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`,
        pageCount: mergedPdf.getPageCount(),
      });
    } catch (error) {
      next(error);
    }
  });
});

router.post('/split', (req, res, next) => {
  req.upload.single('pdf')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF file provided' });

      const pdfBytes = fs.readFileSync(req.file.path);
      const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pageCount = pdf.getPageCount();
      const results = [];

      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        stripMetadata(newPdf);

        const [copiedPage] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(copiedPage);

        const newPdfBytes = await newPdf.save({ useObjectStreams: true, addDefaultPage: false });
        const outputFileName = `${uuidv4()}-page-${i + 1}.pdf`;
        fs.writeFileSync(path.join(req.outputDir, outputFileName), newPdfBytes);

        results.push({
          page: i + 1,
          filename: outputFileName,
          downloadUrl: `/output/${outputFileName}`,
          size: newPdfBytes.length,
        });
      }

      fs.unlinkSync(req.file.path);
      res.json({ success: true, totalPages: pageCount, files: results });
    } catch (error) {
      next(error);
    }
  });
});

router.post('/extract', (req, res, next) => {
  req.upload.single('pdf')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF file provided' });

      const { pages } = req.body;
      if (!pages) return res.status(400).json({ error: 'No pages specified' });

      const pdfBytes = fs.readFileSync(req.file.path);
      const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const totalPages = pdf.getPageCount();
      const pageIndices = parsePageRanges(pages, totalPages);

      if (pageIndices.length === 0) {
        return res.status(400).json({ error: 'Invalid page selection' });
      }

      const newPdf = await PDFDocument.create();
      stripMetadata(newPdf);

      const copiedPages = await newPdf.copyPages(pdf, pageIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const newPdfBytes = await newPdf.save({ useObjectStreams: true, addDefaultPage: false });
      const outputFileName = `${uuidv4()}-extracted.pdf`;
      fs.writeFileSync(path.join(req.outputDir, outputFileName), newPdfBytes);
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`,
        extractedPages: pageIndices.map(i => i + 1),
        pageCount: pageIndices.length,
        size: newPdfBytes.length,
      });
    } catch (error) {
      next(error);
    }
  });
});

router.post('/images-to-pdf', (req, res, next) => {
  req.upload.array('images', 50)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No image files provided' });
      }

      const pdfDoc = await PDFDocument.create();
      const marginSize = req.body.margin ? parseInt(req.body.margin) : 20;
      const verticalAlignment = req.body.alignment || 'center';

      // Page dimensions
      let pageWidth = 595, pageHeight = 842; // A4
      if (req.body.pageSize === 'letter') { pageWidth = 612; pageHeight = 792; }
      else if (req.body.pageSize === 'legal') { pageWidth = 612; pageHeight = 1008; }

      let orderedFiles = req.files;
      if (req.body.order) {
        const order = JSON.parse(req.body.order);
        orderedFiles = order.map(idx => req.files[idx]);
      }

      for (const file of orderedFiles) {
        const imageBuffer = await sharp(file.path).png().toBuffer();
        const image = await pdfDoc.embedPng(imageBuffer);

        const availableWidth = pageWidth - marginSize * 2;
        const availableHeight = pageHeight - marginSize * 2;
        const scale = Math.min(availableWidth / image.width, availableHeight / image.height);
        const scaledWidth = image.width * scale;
        const scaledHeight = image.height * scale;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const x = (pageWidth - scaledWidth) / 2;
        let y;
        if (verticalAlignment === 'top') y = pageHeight - marginSize - scaledHeight;
        else if (verticalAlignment === 'bottom') y = marginSize;
        else y = (pageHeight - scaledHeight) / 2;

        page.drawImage(image, { x, y, width: scaledWidth, height: scaledHeight });
      }

      const pdfBytes = await pdfDoc.save();
      const outputFileName = `${uuidv4()}-images.pdf`;
      fs.writeFileSync(path.join(req.outputDir, outputFileName), pdfBytes);
      req.files.forEach(file => fs.unlinkSync(file.path));

      res.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`,
        pageCount: pdfDoc.getPageCount(),
      });
    } catch (error) {
      next(error);
    }
  });
});

router.post('/info', (req, res, next) => {
  req.upload.single('pdf')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF file provided' });

      const pdfBytes = fs.readFileSync(req.file.path);
      const pdf = await PDFDocument.load(pdfBytes);

      const pageInfo = pdf.getPages().map((page, index) => ({
        page: index + 1,
        width: page.getWidth(),
        height: page.getHeight(),
      }));

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
          fileSize: req.file.size,
        },
      });
    } catch (error) {
      next(error);
    }
  });
});

router.post('/rotate', (req, res, next) => {
  req.upload.single('pdf')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF file provided' });

      const rotationAngle = parseInt(req.body.angle) || 90;
      const pdfBytes = fs.readFileSync(req.file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      const pdfPages = pdf.getPages();
      const totalPages = pdfPages.length;

      const pageIndices = req.body.pages
        ? parsePageRanges(req.body.pages, totalPages)
        : Array.from({ length: totalPages }, (_, i) => i);

      pageIndices.forEach(index => {
        if (index >= 0 && index < totalPages) {
          pdfPages[index].setRotation({ angle: rotationAngle, type: 'degrees' });
        }
      });

      const rotatedPdfBytes = await pdf.save();
      const outputFileName = `${uuidv4()}-rotated.pdf`;
      fs.writeFileSync(path.join(req.outputDir, outputFileName), rotatedPdfBytes);
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`,
        rotatedPages: pageIndices.map(i => i + 1),
        angle: rotationAngle,
      });
    } catch (error) {
      next(error);
    }
  });
});

router.post('/add-page-numbers', (req, res, next) => {
  req.upload.single('pdf')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF file provided' });

      const startNum = parseInt(req.body.startNumber) || 1;
      const position = req.body.position || 'bottom-center';
      const numberFormat = req.body.format;

      const pdfBytes = fs.readFileSync(req.file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();
      const font = await pdf.embedFont(StandardFonts.Helvetica);

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const pageNum = startNum + index;
        const text = numberFormat === 'page-of-total'
          ? `Page ${pageNum} of ${pages.length + startNum - 1}`
          : `${pageNum}`;

        const textWidth = font.widthOfTextAtSize(text, 12);
        let x, y;

        switch (position) {
          case 'top-left':      x = 40; y = height - 30; break;
          case 'top-center':    x = (width - textWidth) / 2; y = height - 30; break;
          case 'top-right':     x = width - textWidth - 40; y = height - 30; break;
          case 'bottom-left':   x = 40; y = 30; break;
          case 'bottom-right':  x = width - textWidth - 40; y = 30; break;
          default:              x = (width - textWidth) / 2; y = 30; break;
        }

        page.drawText(text, { x, y, size: 12, font, color: rgb(0, 0, 0) });
      });

      const numberedPdfBytes = await pdf.save();
      const outputFileName = `${uuidv4()}-numbered.pdf`;
      fs.writeFileSync(path.join(req.outputDir, outputFileName), numberedPdfBytes);
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`,
        pageCount: pages.length,
      });
    } catch (error) {
      next(error);
    }
  });
});

module.exports = router;
