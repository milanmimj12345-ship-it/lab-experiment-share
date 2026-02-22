const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: `lab-experiment-share/${req.body.group || 'general'}/${req.body.lab || 'general'}`,
      resource_type: 'raw', // 'raw' allows ALL file types
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
      use_filename: true,
      unique_filename: true,
    };
  }
});

// Accept ALL file types
const upload = multer({
  storage,
  limits: { fileSize: 40 * 1024 * 1024 } // 40MB
});

module.exports = { cloudinary, upload };
