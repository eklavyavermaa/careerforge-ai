const pdfParse = require('pdf-parse');
const AppError = require('../utils/AppError');

/**
 * Extracts clean text from a PDF buffer, translating every failure mode
 * (empty file, corrupted PDF, unsupported/non-PDF content, no extractable
 * text e.g. a scanned image) into a client-safe AppError.
 *
 * @param {Buffer} buffer
 * @returns {Promise<{ text: string, numPages: number }>}
 */
exports.extractTextFromPdf = async (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new AppError('The uploaded file is empty.', 422);
  }

  let data;
  try {
    data = await pdfParse(buffer);
  } catch (err) {
    throw new AppError(
      'The PDF could not be read. It may be corrupted, password-protected, or not a valid PDF.',
      422
    );
  }

  const text = (data.text || '').replace(/\u0000/g, '').trim();

  if (!text) {
    throw new AppError(
      'No readable text could be extracted from this PDF. It may be a scanned image without a text layer.',
      422
    );
  }

  return { text, numPages: data.numpages || 1 };
};
