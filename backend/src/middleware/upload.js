const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Uploads directory at project root
const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads');

/**
 * Ensure the uploads directory and subdirectories exist.
 */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create base upload dirs on startup
ensureDir(path.join(UPLOADS_DIR, 'products'));
ensureDir(path.join(UPLOADS_DIR, 'categories'));
ensureDir(path.join(UPLOADS_DIR, 'banners'));
ensureDir(path.join(UPLOADS_DIR, 'promos'));
ensureDir(path.join(UPLOADS_DIR, 'settings'));

/**
 * Multer disk storage with unique filenames.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Default folder; routes override via req._uploadFolder
    const folder = req._uploadFolder || '';
    const dest = folder ? path.join(UPLOADS_DIR, folder) : UPLOADS_DIR;
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

/**
 * File filter: only accept images with valid MIME types and extensions.
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIMETYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif).'), false);
  }
};

/**
 * Configured multer instance.
 */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * Get the public URL path for an uploaded file.
 * @param {Object} file - Multer file object (after disk storage)
 * @returns {string} URL path like /uploads/products/abc.jpg
 */
const getFileUrl = (file) => {
  // Get the relative path from UPLOADS_DIR
  const relativePath = path.relative(UPLOADS_DIR, file.path).replace(/\\/g, '/');
  return `/uploads/${relativePath}`;
};

/**
 * Delete a file from the filesystem by its URL path.
 * @param {string} fileUrl - URL path like /uploads/products/abc.jpg
 */
const deleteFile = (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;

  try {
    const relativePath = fileUrl.replace('/uploads/', '');
    // Prevent path traversal
    const safePath = path.normalize(relativePath);
    if (safePath.startsWith('..') || path.isAbsolute(safePath)) return;

    const fullPath = path.join(UPLOADS_DIR, safePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error('Error deleting file:', err.message);
  }
};

/**
 * Middleware to set the upload folder for a route.
 */
const setUploadFolder = (folder) => (req, res, next) => {
  req._uploadFolder = folder;
  next();
};

module.exports = { upload, getFileUrl, deleteFile, setUploadFolder, UPLOADS_DIR };
