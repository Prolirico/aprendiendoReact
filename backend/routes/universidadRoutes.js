const express = require("express");
const router = express.Router();
const {
  getAllUniversidades,
  getUniversidadById,
  createUniversidad,
  updateUniversidad,
  deleteUniversidad,
  deleteUniversidadAdmin,
} = require("../controllers/universidadController");

// Middleware for handling file uploads, e.g., for university logos
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define the path where logos will be stored
    const uploadPath = path.join(__dirname, "..", "uploads", "logos");
    // Create the directory if it does not exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create a unique filename to prevent overwriting files
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

// Filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB file size limit
  },
  fileFilter: fileFilter,
});

/*
 * Note: For a real-world application, you would add authentication and authorization
 * middleware to the routes that modify data (POST, PUT, DELETE).
 * Example:
 * const { protect, admin } = require('../middleware/authMiddleware');
 * router.route('/').post(protect, admin, upload.single('logo'), createUniversidad);
 */

// Routes for the collection of universities
router
  .route("/")
  .get(getAllUniversidades)
  // The 'logo' in upload.single('logo') must match the name attribute of the file input in the frontend form
  .post(upload.single("logo"), createUniversidad);

// Routes for a single university identified by ID
router
  .route("/:id")
  .get(getUniversidadById)
  .put(upload.single("logo"), updateUniversidad)
  .delete(deleteUniversidad);

// Route for deleting just the admin of a university
router.route("/:id/admin").delete(deleteUniversidadAdmin);

module.exports = router;
