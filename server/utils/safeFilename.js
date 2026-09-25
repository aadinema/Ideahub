/**
 * server/utils/safeFilename.js
 * Safe filename handling with content type validation and sanitization.
 *
 * Features:
 * - Sanitize special characters from filenames
 * - Validate extension against MIME type (prevent spoofing)
 * - Content sniffing detection (file magic bytes)
 * - Safe limits on filename length
 */

const path = require('path');
const AppError = require('./AppError');

// MIME type to file extensions mapping (for validation)
const MIME_TO_EXT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'video/mp4': ['.mp4'],
};

// File magic bytes for content sniffing detection
const MAGIC_BYTES = {
  pdf: { bytes: Buffer.from([0x25, 0x50, 0x44, 0x46]), ext: 'pdf' }, // %PDF
  jpeg: { bytes: Buffer.from([0xff, 0xd8, 0xff]), ext: 'jpeg' }, // JPEG SOI marker
  png: { bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]), ext: 'png' }, // PNG
  zip: { bytes: Buffer.from([0x50, 0x4b, 0x03, 0x04]), ext: 'zip' }, // ZIP (used in DOCX/XLSX/PPTX)
  mp4: { bytes: Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]), ext: 'mp4' }, // ftyp signature
};

/**
 * Sanitize filename to prevent path traversal and special character attacks.
 * @param {string} filename Original filename from file upload
 * @returns {string} Sanitized filename
 */
const sanitizeFilename = (filename) => {
  // Get extension and basename
  const ext = path.extname(filename).toLowerCase();
  let name = path.basename(filename, ext);

  // Remove path separators and null bytes
  name = name.replace(/[\\/\0]/g, '');

  // Replace special characters with underscore (allow alphanumeric, dash, underscore)
  name = name.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Collapse consecutive underscores
  name = name.replace(/_+/g, '_');

  // Limit length to 200 characters (plus extension)
  name = name.substring(0, 200);

  return name + ext;
};

/**
 * Validate file extension matches claimed MIME type.
 * Prevents simple spoofing (claiming PDF when actually ZIP).
 * @param {string} filename Original filename
 * @param {string} mimetype MIME type from Multer
 * @throws {AppError} If extension doesn't match MIME type
 */
const validateExtensionMatchesMIME = (filename, mimetype) => {
  const ext = path.extname(filename).toLowerCase();
  const allowedExts = MIME_TO_EXT[mimetype];

  if (!allowedExts) {
    throw new AppError(`Unsupported file type: ${mimetype}`, 400);
  }

  if (!allowedExts.includes(ext)) {
    throw new AppError(
      `File extension "${ext}" does not match MIME type "${mimetype}". Expected: ${allowedExts.join(', ')}`,
      400
    );
  }
};

/**
 * Check file content against magic bytes to detect content spoofing.
 * Reads first few bytes of file to verify actual content type.
 * @param {Buffer} fileBuffer File contents as buffer
 * @param {string} claimedExt Claimed file extension
 * @throws {AppError} If magic bytes don't match claimed type
 */
const validateMagicBytes = (fileBuffer, claimedExt) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new AppError('Empty file', 400);
  }

  const ext = claimedExt.toLowerCase();

  // Check for ZIP-based formats (DOCX, XLSX, PPTX all use ZIP container)
  if (['.docx', '.xlsx', '.pptx'].includes(ext)) {
    // These should start with ZIP magic bytes
    if (!fileBuffer.slice(0, 4).equals(MAGIC_BYTES.zip.bytes)) {
      throw new AppError(
        `File appears to be corrupted or not a valid ${ext.slice(1).toUpperCase()} file (invalid ZIP header)`,
        400
      );
    }
    return;
  }

  // Check for PDF
  if (ext === '.pdf') {
    if (!fileBuffer.slice(0, 4).equals(MAGIC_BYTES.pdf.bytes)) {
      throw new AppError('File does not appear to be a valid PDF (invalid magic bytes)', 400);
    }
    return;
  }

  // Check for JPEG
  if (['.jpg', '.jpeg'].includes(ext)) {
    if (!fileBuffer.slice(0, 3).equals(MAGIC_BYTES.jpeg.bytes)) {
      throw new AppError('File does not appear to be a valid JPEG (invalid magic bytes)', 400);
    }
    return;
  }

  // Check for PNG
  if (ext === '.png') {
    if (!fileBuffer.slice(0, 4).equals(MAGIC_BYTES.png.bytes)) {
      throw new AppError('File does not appear to be a valid PNG (invalid magic bytes)', 400);
    }
    return;
  }

  // Check for MP4
  if (ext === '.mp4') {
    // MP4 magic bytes can appear at different offsets; check common location
    const foundFtyp = fileBuffer.includes(Buffer.from('ftyp'), 4);
    if (!foundFtyp) {
      throw new AppError('File does not appear to be a valid MP4 (missing ftyp signature)', 400);
    }
    return;
  }
};

/**
 * Comprehensive file validation combining extension, MIME type, and magic bytes.
 * @param {Express.Multer.File} file Multer file object
 * @param {Buffer} fileBuffer File contents (for magic byte checking)
 * @throws {AppError} If any validation fails
 */
const validateFile = (file, fileBuffer) => {
  const { originalname, mimetype } = file;

  // 1. Check extension matches MIME type
  validateExtensionMatchesMIME(originalname, mimetype);

  // 2. Check magic bytes (content sniffing)
  validateMagicBytes(fileBuffer, path.extname(originalname));

  // 3. Check filename length after sanitization
  const safe = sanitizeFilename(originalname);
  if (safe.length > 255) {
    throw new AppError('Sanitized filename too long', 400);
  }
};

module.exports = {
  sanitizeFilename,
  validateExtensionMatchesMIME,
  validateMagicBytes,
  validateFile,
};
