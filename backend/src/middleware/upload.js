const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const supabase = require('../config/supabase');

const BUCKET_NAME = 'images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Multer storage: memory buffer (no disk writes).
 */
const storage = multer.memoryStorage();

/**
 * File filter: only accept images.
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
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
 * Upload a file buffer to Supabase Storage and return the public URL.
 *
 * @param {Object} file - Multer file object (buffer, originalname, mimetype)
 * @param {string} bucket - Supabase Storage bucket name
 * @param {string} folder - Folder path inside the bucket
 * @returns {Promise<string>} Public URL of the uploaded file
 */
const uploadToSupabase = async (file, bucket = BUCKET_NAME, folder = '') => {
  const ext = path.extname(file.originalname).toLowerCase();
  const fileName = `${uuidv4()}${ext}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

/**
 * Delete a file from Supabase Storage by its public URL.
 *
 * @param {string} publicUrl - The full public URL
 * @param {string} bucket - Supabase Storage bucket name
 */
const deleteFromSupabase = async (publicUrl, bucket = BUCKET_NAME) => {
  if (!publicUrl) return;

  try {
    // Extract the file path from the public URL
    const urlParts = publicUrl.split(`/storage/v1/object/public/${bucket}/`);
    if (urlParts.length < 2) return;

    const filePath = decodeURIComponent(urlParts[1]);
    await supabase.storage.from(bucket).remove([filePath]);
  } catch (err) {
    console.error('Error deleting file from storage:', err.message);
  }
};

module.exports = { upload, uploadToSupabase, deleteFromSupabase, BUCKET_NAME };
