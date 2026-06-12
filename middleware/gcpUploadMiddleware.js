/**
 * Reusable multer middleware for image/PDF uploads to GCP.
 * Uses memoryStorage so files can be passed to uploadFile (utils/uploadFile.js).
 *
 * Usage:
 *   createUpload({ fields: [{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }] })
 *   createUpload({ single: 'image' })
 *   createUpload({ array: { name: 'documents', maxCount: 5 } })
 *
 * @param {Object} options
 * @param {Array<{name: string, maxCount: number}>} [options.fields] - For multiple named fields
 * @param {string} [options.single] - Field name for single file
 * @param {{name: string, maxCount: number}} [options.array] - For array of files
 * @param {'image'|'pdf'|'imageAndPdf'} [options.fileTypes='imageAndPdf'] - Allowed file types
 * @param {number} [options.maxFileSize=10*1024*1024] - Max file size in bytes (default 10MB)
 */
const multer = require("multer");
const path = require("path");

const MIME_IMAGE = /jpeg|jpg|png|gif|webp/i;
const MIME_PDF = /pdf/i;

const getFileFilter = (fileTypes) => {
  const types = Array.isArray(fileTypes) ? fileTypes : [fileTypes];
  const allowImage = types.includes("image") || types.includes("imageAndPdf");
  const allowPdf = types.includes("pdf") || types.includes("imageAndPdf");

  return (req, file, cb) => {
    const ext = path
      .extname(file.originalname || "")
      .toLowerCase()
      .replace(".", "");
    const mime = file.mimetype || "";

    const imageOk = allowImage && (MIME_IMAGE.test(ext) || MIME_IMAGE.test(mime));
    const pdfOk =
      allowPdf && (MIME_PDF.test(ext) || mime === "application/pdf");

    if (imageOk || pdfOk) {
      return cb(null, true);
    }
    const allowed = [];
    if (allowImage) allowed.push("images (jpeg, png, gif, webp)");
    if (allowPdf) allowed.push("PDF");
    cb(new Error(`Only ${allowed.join(" and ")} are allowed.`), false);
  };
};

const createUpload = (options = {}) => {
  const {
    fields,
    single,
    array,
    fileTypes = "imageAndPdf",
    maxFileSize = 10 * 1024 * 1024,
  } = options;

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSize },
    fileFilter: getFileFilter(fileTypes),
  });

  if (fields && fields.length > 0) {
    return upload.fields(fields);
  }
  if (single) {
    return upload.single(single);
  }
  if (array && array.name) {
    return upload.array(array.name, array.maxCount || 10);
  }

  throw new Error("createUpload: provide fields, single, or array option.");
};

module.exports = { createUpload };
