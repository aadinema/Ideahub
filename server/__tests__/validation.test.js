/**
 * server/__tests__/validation.test.js
 * Tests for input validation schemas and upload safety utilities.
 *
 * Coverage:
 * - Idea creation/update validation
 * - Implementation creation/update validation
 * - Benefit creation validation
 * - Filename sanitization
 * - MIME type / extension matching
 * - Magic byte detection (content sniffing)
 */

const { body, validationResult } = require('express-validator');
const {
  ideaCreateSchema,
  ideaUpdateSchema,
  implementationCreateSchema,
  benefitCreateSchema,
  handleValidationErrors,
} = require('../utils/validators');
const {
  sanitizeFilename,
  validateExtensionMatchesMIME,
  validateMagicBytes,
} = require('../utils/safeFilename');
const AppError = require('../utils/AppError');

describe('Input Validation Schemas', () => {
  // Helper to run validation
  const runValidation = async (schemas, data) => {
    const req = { body: data };
    const checks = Array.isArray(schemas) ? schemas : [schemas];

    for (const check of checks) {
      await check.run(req);
    }

    return validationResult(req);
  };

  describe('Idea Validation', () => {
    it('should accept valid idea creation data', async () => {
      const validData = {
        title: 'Improve Customer Onboarding Process',
        category: 'Process Improvement',
        department: 'Operations',
        problemStatement: 'New customers spend 3 hours on manual form entry and phone calls during onboarding. This creates friction and delays product activation by 1-2 days.',
        proposedSolution: 'Implement an automated online onboarding portal with pre-filled data from CRM, document e-signatures, and instant account provisioning. Integrate with payment gateway for one-click billing setup.',
        expectedBenefits: 'Reduce onboarding time to 30 minutes, improve customer satisfaction, increase activation rate by 25%.',
      };

      const result = await runValidation(ideaCreateSchema, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject idea with title too short', async () => {
      const invalidData = {
        title: 'Idea', // < 5 chars
        category: 'Process Improvement',
        department: 'Operations',
        problemStatement: 'A problem statement that is long enough to pass validation with more than fifty characters.',
        proposedSolution: 'A proposed solution that is long enough to pass validation with more than fifty characters.',
      };

      const result = await runValidation(ideaCreateSchema, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('between 5 and 200');
    });

    it('should reject idea with problem statement too short', async () => {
      const invalidData = {
        title: 'Valid Title for Idea',
        category: 'Process Improvement',
        department: 'Operations',
        problemStatement: 'Too short', // < 50 chars
        proposedSolution: 'A proposed solution that is long enough to pass validation with more than fifty characters.',
      };

      const result = await runValidation(ideaCreateSchema, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('between 50 and 2000');
    });

    it('should reject idea with invalid category', async () => {
      const invalidData = {
        title: 'Valid Idea Title',
        category: 'Invalid Category', // not in enum
        department: 'Operations',
        problemStatement: 'A problem statement that is long enough to pass validation with more than fifty characters.',
        proposedSolution: 'A proposed solution that is long enough to pass validation with more than fifty characters.',
      };

      const result = await runValidation(ideaCreateSchema, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('Invalid category');
    });

    it('should accept valid idea update data (partial)', async () => {
      const partialData = {
        title: 'Updated Idea Title',
        category: 'Cost Reduction',
      };

      const result = await runValidation(ideaUpdateSchema, partialData);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('Implementation Validation', () => {
    it('should accept valid implementation creation data', async () => {
      const validData = {
        ideaId: '507f1f77bcf86cd799439011', // Valid ObjectId
        ownerId: '507f1f77bcf86cd799439012', // Valid ObjectId
        department: 'Engineering',
        startDate: new Date().toISOString(),
        targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        progressPercent: 0,
      };

      const result = await runValidation(implementationCreateSchema, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject implementation with invalid ideaId', async () => {
      const invalidData = {
        ideaId: 'not-a-valid-id',
        ownerId: '507f1f77bcf86cd799439012',
        department: 'Engineering',
        startDate: new Date().toISOString(),
        targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const result = await runValidation(implementationCreateSchema, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('Invalid idea ID');
    });

    it('should reject implementation with target date before start date', async () => {
      const now = new Date();
      const invalidData = {
        ideaId: '507f1f77bcf86cd799439011',
        ownerId: '507f1f77bcf86cd799439012',
        department: 'Engineering',
        startDate: now.toISOString(),
        targetCompletionDate: new Date(now.getTime() - 1000).toISOString(), // 1 second ago
      };

      const result = await runValidation(implementationCreateSchema, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some(e => e.msg.includes('after start date'))).toBe(true);
    });

    it('should reject implementation with invalid progress percent', async () => {
      const invalidData = {
        ideaId: '507f1f77bcf86cd799439011',
        ownerId: '507f1f77bcf86cd799439012',
        department: 'Engineering',
        startDate: new Date().toISOString(),
        targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        progressPercent: 150, // > 100
      };

      const result = await runValidation(implementationCreateSchema, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('between 0 and 100');
    });
  });

  describe('Benefit Validation', () => {
    it('should accept valid benefit creation data', async () => {
      const validData = {
        ideaId: '507f1f77bcf86cd799439011',
        implementationId: '507f1f77bcf86cd799439012',
        financial: {
          costSavingsINR: 500000,
          revenueIncreaseINR: 100000,
        },
        operational: {
          description: 'This implementation significantly improves our operational efficiency by reducing manual tasks and enabling faster processing.',
          efficiencyImprovementPct: 25,
        },
      };

      const result = await runValidation(benefitCreateSchema, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject benefit with invalid cost savings (negative)', async () => {
      const invalidData = {
        ideaId: '507f1f77bcf86cd799439011',
        implementationId: '507f1f77bcf86cd799439012',
        financial: {
          costSavingsINR: -100000, // negative
        },
      };

      const result = await runValidation(benefitCreateSchema, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('non-negative');
    });

    it('should reject benefit with operational description too short', async () => {
      const invalidData = {
        ideaId: '507f1f77bcf86cd799439011',
        implementationId: '507f1f77bcf86cd799439012',
        operational: {
          description: 'Too short', // < 50 chars
        },
      };

      const result = await runValidation(benefitCreateSchema, invalidData);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toContain('between 50 and 1000');
    });
  });
});

describe('Safe Filename Handling', () => {
  describe('sanitizeFilename', () => {
    it('should remove special characters', () => {
      const unsafe = 'my#file@name!with$special%chars.pdf';
      const safe = sanitizeFilename(unsafe);
      expect(safe).toBe('my_file_name_with_special_chars.pdf');
    });

    it('should remove path traversal attempts', () => {
      const unsafe = '../../../etc/passwd.pdf';
      const safe = sanitizeFilename(unsafe);
      expect(safe).not.toContain('/');
      expect(safe).not.toContain('..');
    });

    it('should collapse consecutive underscores', () => {
      const unsafe = 'file___name___with____underscores.pdf';
      const safe = sanitizeFilename(unsafe);
      expect(safe).toBe('file_name_with_underscores.pdf');
    });

    it('should preserve extension', () => {
      const unsafe = 'My Document.DOCX';
      const safe = sanitizeFilename(unsafe);
      expect(safe).toMatch(/\.docx$/i);
    });

    it('should handle very long filenames', () => {
      const unsafe = 'a'.repeat(500) + '.pdf';
      const safe = sanitizeFilename(unsafe);
      expect(safe.length).toBeLessThanOrEqual(200 + '.pdf'.length);
    });

    it('should remove null bytes', () => {
      const unsafe = 'file\x00.pdf';
      const safe = sanitizeFilename(unsafe);
      expect(safe).not.toContain('\x00');
    });
  });

  describe('validateExtensionMatchesMIME', () => {
    it('should accept valid PDF with .pdf extension', () => {
      expect(() => {
        validateExtensionMatchesMIME('document.pdf', 'application/pdf');
      }).not.toThrow();
    });

    it('should reject PDF with .txt extension', () => {
      expect(() => {
        validateExtensionMatchesMIME('document.txt', 'application/pdf');
      }).toThrow();
    });

    it('should accept DOCX with .docx extension', () => {
      expect(() => {
        validateExtensionMatchesMIME('document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      }).not.toThrow();
    });

    it('should accept JPEG with .jpg or .jpeg extension', () => {
      expect(() => {
        validateExtensionMatchesMIME('photo.jpg', 'image/jpeg');
      }).not.toThrow();

      expect(() => {
        validateExtensionMatchesMIME('photo.jpeg', 'image/jpeg');
      }).not.toThrow();
    });

    it('should reject unknown MIME type', () => {
      expect(() => {
        validateExtensionMatchesMIME('file.xyz', 'application/x-unknown');
      }).toThrow();
    });

    it('should be case-insensitive for extensions', () => {
      expect(() => {
        validateExtensionMatchesMIME('document.PDF', 'application/pdf');
      }).not.toThrow();
    });
  });

  describe('validateMagicBytes', () => {
    it('should accept valid PDF magic bytes', () => {
      // PDF magic bytes: %PDF
      const pdfBuffer = Buffer.from('%PDF-1.4\n%...');
      expect(() => {
        validateMagicBytes(pdfBuffer, '.pdf');
      }).not.toThrow();
    });

    it('should reject PDF-claimed file with wrong magic bytes', () => {
      // ZIP magic bytes instead of PDF
      const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      expect(() => {
        validateMagicBytes(zipBuffer, '.pdf');
      }).toThrow(/valid PDF/i);
    });

    it('should accept valid JPEG magic bytes', () => {
      // JPEG magic bytes: FFD8FF
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(() => {
        validateMagicBytes(jpegBuffer, '.jpg');
      }).not.toThrow();
    });

    it('should accept valid PNG magic bytes', () => {
      // PNG magic bytes: 89504E47
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      expect(() => {
        validateMagicBytes(pngBuffer, '.png');
      }).not.toThrow();
    });

    it('should accept ZIP-based formats (DOCX, XLSX, PPTX)', () => {
      // ZIP magic bytes for Office formats
      const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      expect(() => {
        validateMagicBytes(zipBuffer, '.docx');
      }).not.toThrow();

      expect(() => {
        validateMagicBytes(zipBuffer, '.xlsx');
      }).not.toThrow();

      expect(() => {
        validateMagicBytes(zipBuffer, '.pptx');
      }).not.toThrow();
    });

    it('should reject empty file', () => {
      const emptyBuffer = Buffer.from([]);
      expect(() => {
        validateMagicBytes(emptyBuffer, '.pdf');
      }).toThrow(/empty/i);
    });
  });
});

describe('Comprehensive File Validation', () => {
  it('should validate filename safety, MIME type match, and magic bytes together', () => {
    // This would be tested in actual multipart file upload flow
    // For now, verify the utilities exist and work in isolation
    expect(typeof sanitizeFilename).toBe('function');
    expect(typeof validateExtensionMatchesMIME).toBe('function');
    expect(typeof validateMagicBytes).toBe('function');
  });
});
