/**
 * server/services/storageService.js
 * StorageProvider abstraction — swap local disk ↔ S3-compatible with one env var.
 * STORAGE_PROVIDER=local  → writes to LOCAL_UPLOAD_DIR (dev only)
 * STORAGE_PROVIDER=s3     → writes to S3_BUCKET (production)
 *
 * Every attachment URL returned is a fully-qualified path usable in img/link tags.
 * FRD FR-02-04, Master Prompt §2 (Multer + S3-compatible abstraction)
 */
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Local disk provider
// ---------------------------------------------------------------------------
const localProvider = {
  /**
   * Move an already-multer-written file to its final destination.
   * Multer disk storage handles the actual write; this returns the public URL.
   * @param {Express.Multer.File} file
   * @returns {{ url: string, key: string }}
   */
  getFileInfo(file) {
    const relativePath = file.path.replace(
      path.join(__dirname, '../../'),
      ''
    );
    const url = `${process.env.SERVER_BASE_URL || 'http://localhost:5000'}/${relativePath.replace(/\\/g, '/')}`;
    return { url, key: relativePath };
  },

  async deleteFile(key) {
    try {
      const fullPath = path.join(__dirname, '../../', key);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch (err) {
      logger.warn(`storageService.local: failed to delete ${key}`, { err: err.message });
    }
  },
};

// ---------------------------------------------------------------------------
// S3-compatible provider (AWS SDK v3 — lazy-loaded to avoid requiring it in dev)
// ---------------------------------------------------------------------------
const s3Provider = {
  async getFileInfo(file) {
    // Multer S3 (multer-s3 package) sets file.location and file.key
    return {
      url: file.location,
      key: file.key,
    };
  },

  async deleteFile(key) {
    try {
      const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const client = new S3Client({ region: process.env.S3_REGION });
      await client.send(
        new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key })
      );
    } catch (err) {
      logger.warn(`storageService.s3: failed to delete ${key}`, { err: err.message });
    }
  },
};

// ---------------------------------------------------------------------------
// Export the active provider based on env
// ---------------------------------------------------------------------------
const provider = process.env.STORAGE_PROVIDER === 's3' ? s3Provider : localProvider;

module.exports = provider;
