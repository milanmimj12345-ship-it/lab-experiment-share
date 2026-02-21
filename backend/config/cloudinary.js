const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Allowed file formats
const allowedFormats = [
  'c', 'cpp', 'py', 'java', 'sql', 'txt', 'js', 'ts',
  'pdf', 'doc', 'docx',
  'png', 'jpg', 'jpeg', 'gif', 'webp',
  'mp4', 'avi', 'mov', 'mkv'
];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    return {
      folder: `lab-experiment-share/${req.body.group || 'general'}/${req.body.lab || 'general'}`,
      resource_type: 'auto',
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
      allowed_formats: allowedFormats
    };
  }
});

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 40 * 1024 * 1024 } // 40MB
});

module.exports = { cloudinary, upload };
