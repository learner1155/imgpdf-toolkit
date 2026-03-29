const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const safeUnlink = (filePath) => {
  setTimeout(() => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      // File will be cleaned up by periodic cleanup
      console.log('File will be cleaned up later:', filePath);
    }
  }, 2000);
};

// Manual BMP encoder (sharp doesn't support BMP output)
const createBMP = (data, width, height, channels) => {
  const rowSize = Math.ceil((width * 3) / 4) * 4; // BMP rows are padded to 4 bytes
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize; // 54 = header size
  
  const buffer = Buffer.alloc(fileSize);
  
  // BMP File Header (14 bytes)
  buffer.write('BM', 0); // Signature
  buffer.writeUInt32LE(fileSize, 2); // File size
  buffer.writeUInt32LE(0, 6); // Reserved
  buffer.writeUInt32LE(54, 10); // Pixel data offset
  
  // DIB Header (40 bytes)
  buffer.writeUInt32LE(40, 14); // DIB header size
  buffer.writeInt32LE(width, 18); // Width
  buffer.writeInt32LE(-height, 22); // Height (negative for top-down)
  buffer.writeUInt16LE(1, 26); // Color planes
  buffer.writeUInt16LE(24, 28); // Bits per pixel
  buffer.writeUInt32LE(0, 30); // Compression (none)
  buffer.writeUInt32LE(pixelDataSize, 34); // Image size
  buffer.writeInt32LE(2835, 38); // X pixels per meter
  buffer.writeInt32LE(2835, 42); // Y pixels per meter
  buffer.writeUInt32LE(0, 46); // Colors in color table
  buffer.writeUInt32LE(0, 50); // Important colors
  
  // Pixel data (BGR format, rows padded to 4 bytes)
  let offset = 54;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * channels;
      // Convert RGB(A) to BGR
      buffer[offset++] = data[srcIdx + 2] || 0; // B
      buffer[offset++] = data[srcIdx + 1] || 0; // G
      buffer[offset++] = data[srcIdx] || 0;     // R
    }
    // Pad row to 4-byte boundary
    const padding = rowSize - width * 3;
    for (let p = 0; p < padding; p++) {
      buffer[offset++] = 0;
    }
  }
  
  return buffer;
};

router.post('/convert', (req, res, next) => {
  req.upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    let inputPath = null;
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const { format, quality, width, height } = req.body;
      inputPath = req.file.path;
      const outputFileName = `${uuidv4()}.${format || 'png'}`;
      const outputPath = path.join(req.outputDir, outputFileName);

      // Read file into buffer first to release file handle
      const inputBuffer = fs.readFileSync(inputPath);
      let sharpInstance = sharp(inputBuffer);

      // Resize if dimensions provided
      if (width || height) {
        sharpInstance = sharpInstance.resize(
          width ? parseInt(width) : null,
          height ? parseInt(height) : null,
          { fit: 'inside', withoutEnlargement: true }
        );
      }

      // Convert to specified format
      const qualityNum = quality ? parseInt(quality) : 90;

      // Helper: clone + flatten alpha to white (for formats that don't support transparency)
      const flat = () => sharpInstance.clone().flatten({ background: { r: 255, g: 255, b: 255 } });

      switch (format) {
        case 'jpeg':
        case 'jpg':
          await flat().jpeg({ quality: qualityNum }).toFile(outputPath);
          break;
        case 'png':
          await sharpInstance.clone().png({ compressionLevel: Math.floor((100 - qualityNum) / 11) }).toFile(outputPath);
          break;
        case 'webp':
          await sharpInstance.clone().webp({ quality: qualityNum }).toFile(outputPath);
          break;
        case 'gif':
          await sharpInstance.clone().gif().toFile(outputPath);
          break;
        case 'tiff':
        case 'tif':
          await flat().tiff({ quality: qualityNum }).toFile(outputPath);
          break;
        case 'avif':
          await sharpInstance.clone().avif({ quality: qualityNum }).toFile(outputPath);
          break;
        case 'bmp': {
          const { data, info } = await flat().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
          const bmpBuffer = createBMP(data, info.width, info.height, info.channels);
          fs.writeFileSync(outputPath, bmpBuffer);
          break;
        }
        case 'ico':
          await sharpInstance.clone().resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(outputPath);
          break;
        case 'svg': {
          const inputExt = path.extname(req.file.originalname).toLowerCase();
          if (inputExt === '.svg') {
            fs.writeFileSync(outputPath, inputBuffer);
          } else {
            const pngBuf = await sharpInstance.clone().png().toBuffer();
            const meta = await sharp(pngBuf).metadata();
            const b64 = pngBuf.toString('base64');
            fs.writeFileSync(outputPath, `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}" viewBox="0 0 ${meta.width} ${meta.height}">\n  <image width="${meta.width}" height="${meta.height}" href="data:image/png;base64,${b64}"/>\n</svg>`);
          }
          break;
        }
        default:
          await sharpInstance.clone().png().toFile(outputPath);
      }

      safeUnlink(inputPath);

      res.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`
      });
    } catch (error) {
      if (inputPath) safeUnlink(inputPath);
      next(error);
    }
  });
});

router.post('/batch-convert', (req, res, next) => {
  req.upload.array('images', 20)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const filesToClean = [];
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No image files provided' });
      }

      const { format, quality } = req.body;
      const results = [];
      const qualityNum = quality ? parseInt(quality) : 90;

      for (const file of req.files) {
        filesToClean.push(file.path);
        const outputFileName = `${uuidv4()}.${format || 'png'}`;
        const outputPath = path.join(req.outputDir, outputFileName);


        const inputBuffer = fs.readFileSync(file.path);
        const sharpInstance = sharp(inputBuffer);

        // Helper: clone + flatten alpha to white (for formats that don't support transparency)
        const flat = () => sharpInstance.clone().flatten({ background: { r: 255, g: 255, b: 255 } });

        switch (format) {
          case 'jpeg':
          case 'jpg':
            await flat().jpeg({ quality: qualityNum }).toFile(outputPath);
            break;
          case 'png':
            await sharpInstance.clone().png({ compressionLevel: Math.floor((100 - qualityNum) / 11) }).toFile(outputPath);
            break;
          case 'webp':
            await sharpInstance.clone().webp({ quality: qualityNum }).toFile(outputPath);
            break;
          case 'gif':
            await sharpInstance.clone().gif().toFile(outputPath);
            break;
          case 'tiff':
          case 'tif':
            await flat().tiff({ quality: qualityNum }).toFile(outputPath);
            break;
          case 'avif':
            await sharpInstance.clone().avif({ quality: qualityNum }).toFile(outputPath);
            break;
          case 'bmp': {
            const { data: bmpData, info: bmpInfo } = await flat().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
            const bmpBuf = createBMP(bmpData, bmpInfo.width, bmpInfo.height, bmpInfo.channels);
            fs.writeFileSync(outputPath, bmpBuf);
            break;
          }
          case 'ico':
            await sharpInstance.clone().resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(outputPath);
            break;
          case 'svg': {
            const inputExt = path.extname(file.originalname).toLowerCase();
            if (inputExt === '.svg') {
              fs.writeFileSync(outputPath, inputBuffer);
            } else {
              const pngBuf = await sharpInstance.clone().png().toBuffer();
              const meta = await sharp(pngBuf).metadata();
              const b64 = pngBuf.toString('base64');
              fs.writeFileSync(outputPath, `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}" viewBox="0 0 ${meta.width} ${meta.height}">\n  <image width="${meta.width}" height="${meta.height}" href="data:image/png;base64,${b64}"/>\n</svg>`);
            }
            break;
          }
          default:
            await sharpInstance.clone().png().toFile(outputPath);
        }

        results.push({
          originalName: file.originalname,
          filename: outputFileName,
          downloadUrl: `/output/${outputFileName}`
        });
      }


      filesToClean.forEach(f => safeUnlink(f));

      res.json({
        success: true,
        files: results
      });
    } catch (error) {
      filesToClean.forEach(f => safeUnlink(f));
      next(error);
    }
  });
});

router.post('/compress', (req, res, next) => {
  req.upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    let inputPath = null;
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const { quality } = req.body;
      inputPath = req.file.path;
      const ext = path.extname(req.file.originalname).slice(1).toLowerCase() || 'jpg';
      const outputFileName = `${uuidv4()}-compressed.${ext === 'jpeg' ? 'jpg' : ext}`;
      const outputPath = path.join(req.outputDir, outputFileName);

      const qualityNum = quality ? parseInt(quality) : 70;


      const originalSize = fs.statSync(inputPath).size;


      const inputBuffer = fs.readFileSync(inputPath);
      let sharpInstance = sharp(inputBuffer);
      
      switch (ext) {
        case 'jpeg':
        case 'jpg':
          await sharpInstance.jpeg({ quality: qualityNum }).toFile(outputPath);
          break;
        case 'png':
          await sharpInstance.png({ compressionLevel: Math.floor((100 - qualityNum) / 11) }).toFile(outputPath);
          break;
        case 'webp':
          await sharpInstance.webp({ quality: qualityNum }).toFile(outputPath);
          break;
        case 'tiff':
        case 'tif':
          await sharpInstance.tiff({ quality: qualityNum }).toFile(outputPath);
          break;
        case 'avif':
          await sharpInstance.avif({ quality: qualityNum }).toFile(outputPath);
          break;
        default:
          await sharpInstance.jpeg({ quality: qualityNum }).toFile(outputPath);
      }


      const compressedSize = fs.statSync(outputPath).size;

      safeUnlink(inputPath);

      res.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`,
        originalSize,
        compressedSize,
        savedPercentage: Math.round((1 - compressedSize / originalSize) * 100)
      });
    } catch (error) {
      if (inputPath) safeUnlink(inputPath);
      next(error);
    }
  });
});

router.post('/resize', (req, res, next) => {
  req.upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    let inputPath = null;
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const { width, height, fit } = req.body;
      inputPath = req.file.path;
      const ext = path.extname(req.file.originalname).slice(1) || 'png';
      const outputFileName = `${uuidv4()}-resized.${ext}`;
      const outputPath = path.join(req.outputDir, outputFileName);


      const inputBuffer = fs.readFileSync(inputPath);
      
      await sharp(inputBuffer)
        .resize(
          width ? parseInt(width) : null,
          height ? parseInt(height) : null,
          { fit: fit || 'inside', withoutEnlargement: false }
        )
        .toFile(outputPath);


      safeUnlink(inputPath);

      res.json({
        success: true,
        filename: outputFileName,
        downloadUrl: `/output/${outputFileName}`
      });
    } catch (error) {
      if (inputPath) safeUnlink(inputPath);
      next(error);
    }
  });
});

router.post('/info', (req, res, next) => {
  req.upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    let inputPath = null;
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      inputPath = req.file.path;
      

      const inputBuffer = fs.readFileSync(inputPath);
      const metadata = await sharp(inputBuffer).metadata();


      safeUnlink(inputPath);

      res.json({
        success: true,
        info: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          channels: metadata.channels,
          depth: metadata.depth,
          density: metadata.density,
          hasAlpha: metadata.hasAlpha,
          size: req.file.size
        }
      });
    } catch (error) {
      if (inputPath) safeUnlink(inputPath);
      next(error);
    }
  });
});

module.exports = router;
