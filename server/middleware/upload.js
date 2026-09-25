/**
 * server/middleware/upload.js
 * Multer file upload middleware with FR-02-04 constraints enforced server-side.
 *
 * Constraints (from shared/constants.js UPLOAD_CONSTRAINTS):
 *  - Max 5 files per submission
 *  - Max 20 MB per file
 *  - Allowed types: PDF, DOCX, XLSX, JPG, PNG, PPTX, MP4
 *
 * Uses disk storage in dev (STORAGE_PROVIDER=local).
 * In production, swap to multer-s3 by changing the storage engine.
 *
 * FRD FR-02-04, Master Prompt §2
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');
const { UPLOAD_CONSTRAINTS } = require('../../shared/constants');
const { validateFile, sanitizeFilename } = require('../utils/safeFilename');

// ---------------------------------------------------------------------------
// Ensure upload directory exists (local dev only)
// ---------------------------------------------------------------------------
const localUploadDir = process.env.LOCAL_UPLOAD_DIR
  ? path.resolve(process.env.LOCAL_UPLOAD_DIR)
  : path.join(__dirname, '../../uploads');

if (process.env.STORAGE_PROVIDER !== 's3') {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Storage engine selection
// ---------------------------------------------------------------------------
let storage;

if (process.env.STORAGE_PROVIDER === 's3') {
  // Lazy-require multer-s3 (not installed by default — add to package.json if needed)
  const multerS3 = require('multer-s3');
  const { S3Client } = require('@aws-sdk/client-s3');
  const s3 = new S3Client({ region: process.env.S3_REGION });

  storage = multerS3({
    s3,
    bucket: process.env.S3_BUCKET,
    metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `ideas/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, uniqueName);
    },
  });
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, localUploadDir),
    filename: (req, file, cb) => {
      const safeName = sanitizeFilename(file.originalname);
      cb(null, `${Date.now()}-${safeName}`);
    },
  });
}

// ---------------------------------------------------------------------------
// File filter — enforce allowed MIME types (FR-02-04)
// ---------------------------------------------------------------------------
const fileFilter = (req, file, cb) => {
  if (UPLOAD_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `File type not allowed: ${file.mimetype}. Allowed: PDF, DOCX, XLSX, JPG, PNG, PPTX, MP4`,
        400
      ),
      false
    );
  }
};

// ---------------------------------------------------------------------------
// Multer instance
// ---------------------------------------------------------------------------
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_CONSTRAINTS.MAX_SIZE_BYTES, // 20 MB per file
    files: UPLOAD_CONSTRAINTS.MAX_FILES,          // max 5 files
  },
});

/**
 * Helper to build custom field upload middleware with error handling.
 */
const createUploadMiddleware = (fieldName = 'attachments') => (req, res, next) => {
  const multerMiddleware = upload.array(fieldName, UPLOAD_CONSTRAINTS.MAX_FILES);

  multerMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(`File too large. Maximum size is 20 MB per file (FR-02-04).`, 400));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError(`Too many files. Maximum 5 attachments allowed (FR-02-04).`, 400));
    }
    if (err instanceof multer.MulterError) {
      return next(new AppError(`Upload error: ${err.message}`, 400));
    }
    
    // Now validate files content-sniffing
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          if (process.env.STORAGE_PROVIDER !== 's3') {
            // Read first 10 bytes for magic bytes check
            const buffer = Buffer.alloc(10);
            const fd = fs.openSync(file.path, 'r');
            fs.readSync(fd, buffer, 0, 10, 0);
            fs.closeSync(fd);
            validateFile(file, buffer);
          } else {
            // In S3 we would stream part of it, but for simplicity we rely on multer-s3 MIME type
            // validateExtensionMatchesMIME is still called by validateFile but we'd need to mock buffer
            // Since S3 stream is already consumed, robust magic byte check requires streaming through a pass-through
          }
        } catch (validationErr) {
          // Clean up files if validation fails
          if (process.env.STORAGE_PROVIDER !== 's3') {
            for (const f of req.files) {
              if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
            }
          }
          return next(validationErr);
        }
      }
    }

    next(err);
  });
};

const uploadAttachments = createUploadMiddleware('attachments');
const uploadEvidence = createUploadMiddleware('evidence');

module.exports = { upload, uploadAttachments, uploadEvidence };
