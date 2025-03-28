const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const checkURLRoute = require("./routes/checkURLs"); // Import checkURL route

const PORT = 3000;
const app = express();

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Enable sessions
app.use(
  session({
    secret: "test_secret_key", // Use a secure key in production
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
app.post("/upload", upload.single("csvFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const robotsPath = req.body.robotsPath; // Get robots.txt URL from the form
  if (!robotsPath) {
    return res.status(400).send("robots.txt path is required.");
  }

  // Redirect with the robotsPath as a query parameter
  res.redirect(
    `/read/${req.file.filename}?robotsPath=${encodeURIComponent(robotsPath)}`
  );
});

// Use the checkURL route for CSV processing
app.use(checkURLRoute);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
