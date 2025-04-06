const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const checkURLRoute = require("./routes/checkURLs"); // Import checkURL route
const createCsvFromManual = require("./utils/createCsvFromManual");
require("dotenv").config(); // Load environment variables from .env

const PORT = process.env.PORT || 3000; // Use .env value or default to 3000
const SECRET_KEY = process.env.SESSION_SECRET || "test_secret_key";
const app = express();

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Enable sessions
app.use(
  session({
    secret: SECRET_KEY, // Use a secure key in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Ensure 'uploads' folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer Configuration for File Uploads
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name.toLowerCase();
    const extension = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `${originalName}-${timestamp}${extension}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv") {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"), false);
    }
  },
});

// Serve the Upload Page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// File Upload Route
app.post("/upload", upload.single("csvFile"), async (req, res) => {
  const robotsPath = req.body.robotsPath;
  if (!robotsPath) {
    return res.status(400).send("robots.txt path is required.");
  }

  try {
    let filename = "";

    // ✅ CASE 1: File is uploaded
    if (req.file) {
      filename = req.file.filename;
    }
    // ✅ CASE 2: Manual URLs are provided instead
    else if (req.body.manualUrls) {
      const manualUrls = JSON.parse(req.body.manualUrls);
      if (!Array.isArray(manualUrls) || manualUrls.length === 0) {
        return res.status(400).send("Manual URLs array is empty or invalid.");
      }

      filename = await createCsvFromManual(manualUrls);
    }
    // ❌ CASE 3: Nothing provided
    else {
      return res
        .status(400)
        .send("No CSV file uploaded or manual URLs provided.");
    }

    // ✅ Redirect to common CSV reading route
    return res.redirect(
      `/read/${filename}?robotsPath=${encodeURIComponent(robotsPath)}`
    );
  } catch (err) {
    console.error("Upload processing error:", err);
    return res
      .status(500)
      .send("Something went wrong while processing the request.");
  }
});

// Use the checkURL route for CSV processing
app.use(checkURLRoute);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
