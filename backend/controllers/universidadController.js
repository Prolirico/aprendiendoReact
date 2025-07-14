const Universidad = require("../models/universidadModel");
const User = require("../models/userModel");
const pool = require("../config/db"); // Import the pool for transactions
const fs = require("fs");
const path = require("path");

// Helper function for handling errors and transactions
const handleError = async (res, error, message, connection) => {
  if (connection) {
    await connection.rollback();
    connection.release();
  }
  console.error(message, error);
  // Avoid sending back detailed internal error messages in production
  const errorMessage =
    process.env.NODE_ENV === "production" && !(error && error.isOperational)
      ? "An unexpected error occurred."
      : error
        ? error.message
        : message;
  const statusCode = error && error.statusCode ? error.statusCode : 500;
  res.status(statusCode).json({ error: errorMessage });
};

// @desc    Get all universities with pagination and search
// @route   GET /api/universidades
// @access  Public
exports.getAllUniversidades = async (req, res) => {
  try {
    const { searchTerm = "", page = 1, limit = 10 } = req.query;
    const options = {
      searchTerm,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
    const result = await Universidad.findAll(options);
    res.status(200).json(result);
  } catch (error) {
    await handleError(res, error, "Failed to retrieve universities", null);
  }
};

// @desc    Get a single university by ID
// @route   GET /api/universidades/:id
// @access  Public
exports.getUniversidadById = async (req, res) => {
  try {
    const { id } = req.params;
    const universidad = await Universidad.findById(id);
    if (!universidad) {
      const err = new Error("University not found");
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }
    res.status(200).json(universidad);
  } catch (error) {
    await handleError(res, error, "Failed to retrieve university", null);
  }
};

// @desc    Create a new university and its admin user
// @route   POST /api/universidades
// @access  Private/Admin (should be protected)
exports.createUniversidad = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const {
      nombre,
      clave_universidad,
      direccion,
      telefono,
      email_contacto,
      ubicacion,
      email_admin, // New field for admin user
      password, // New field for admin user
    } = req.body;

    if (!nombre || !clave_universidad) {
      const err = new Error(
        "Missing required fields: nombre and clave_universidad are required.",
      );
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }

    // 1. Create University
    const universityData = {
      nombre,
      clave_universidad,
      direccion,
      telefono,
      email_contacto,
      ubicacion,
      logo_url: req.file ? `/uploads/logos/${req.file.filename}` : null,
    };
    const { id_universidad } = await Universidad.create(
      universityData,
      connection,
    );

    // 2. Create Admin User (if details are provided)
    if (email_admin && password) {
      await User.createOrUpdateAdmin(
        id_universidad,
        email_admin,
        password,
        connection,
      );
    }

    await connection.commit();
    connection.release();

    const newUniversity = await Universidad.findById(id_universidad);
    res.status(201).json(newUniversity);
  } catch (error) {
    // If a file was uploaded during a failed transaction, delete it.
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err)
          console.error(
            "Failed to delete orphaned file after transaction rollback:",
            req.file.path,
          );
      });
    }
    if (error.code === "ER_DUP_ENTRY") {
      error.message =
        "A university or user with that key/email already exists.";
      error.statusCode = 409;
      error.isOperational = true;
    }
    await handleError(res, error, "Failed to create university", connection);
  }
};

// @desc    Update a university and its admin user
// @route   PUT /api/universidades/:id
// @access  Private/Admin (should be protected)
exports.updateUniversidad = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const existingUniversity = await Universidad.findById(id);
    if (!existingUniversity) {
      const err = new Error("University not found");
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    const { email_admin, password, ...universityUpdateData } = req.body;

    // Handle logo file update
    if (req.file) {
      universityUpdateData.logo_url = `/uploads/logos/${req.file.filename}`;
      // Delete the old logo if it exists
      if (existingUniversity.logo_url) {
        const oldLogoPath = path.join(
          __dirname,
          "..",
          existingUniversity.logo_url,
        );
        fs.unlink(oldLogoPath, (err) => {
          if (err) console.error("Failed to delete old logo:", oldLogoPath);
        });
      }
    }

    // 1. Update University Details
    await Universidad.update(id, universityUpdateData, connection);

    // 2. Update/Create Admin User
    await User.createOrUpdateAdmin(id, email_admin, password, connection);

    await connection.commit();
    connection.release();

    const updatedUniversidad = await Universidad.findById(id);
    res.status(200).json(updatedUniversidad);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      error.message =
        "Update failed. A university or user with that key/email already exists.";
      error.statusCode = 409;
      error.isOperational = true;
    }
    await handleError(res, error, "Failed to update university", connection);
  }
};

// @desc    Delete a university
// @route   DELETE /api/universidades/:id
// @access  Private/Admin
exports.deleteUniversidad = async (req, res) => {
  try {
    const { id } = req.params;
    const university = await Universidad.findById(id);
    if (!university) {
      const err = new Error("University not found");
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    const result = await Universidad.remove(id);

    if (result.affectedRows === 0) {
      const err = new Error("Deletion failed, university not found.");
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    // If DB deletion is successful, delete the associated logo file
    if (university.logo_url) {
      const logoPath = path.join(__dirname, "..", university.logo_url);
      fs.unlink(logoPath, (err) => {
        if (err) console.error("Failed to delete logo file:", logoPath, err);
      });
    }

    res.status(200).json({ message: "University deleted successfully" });
  } catch (error) {
    await handleError(res, error, "Failed to delete university", null);
  }
};

// @desc    Delete an admin user for a specific university
// @route   DELETE /api/universidades/:id/admin
// @access  Private/Admin
exports.deleteUniversidadAdmin = async (req, res) => {
  let connection;
  try {
    const { id } = req.params; // This is the university ID

    // Ensure the university exists
    const university = await Universidad.findById(id);
    if (!university) {
      const err = new Error("University not found");
      err.statusCode = 404;
      throw err;
    }
    if (!university.email_admin) {
      const err = new Error("No admin is assigned to this university.");
      err.statusCode = 400;
      throw err;
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const result = await User.deleteAdminByUniversityId(id, connection);

    if (result.affectedRows === 0) {
      const err = new Error("Deletion failed, administrator not found.");
      err.statusCode = 404;
      throw err;
    }

    await connection.commit();
    res.status(200).json({ message: "Administrator deleted successfully" });
  } catch (error) {
    await handleError(res, error, "Failed to delete administrator", connection);
  } finally {
    if (connection) connection.release();
  }
};
