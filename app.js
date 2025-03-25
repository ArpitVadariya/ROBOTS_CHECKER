const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");

const app = express();
const PORT = 3000;

// check that upload folder created or not
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: uploadDir, // Save files in "uploads" directory
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name.toLowerCase(); // Get filename without extension and convert to lowercase
    const extension = path.extname(file.originalname); // Get file extension
    const timestamp = Date.now(); // Get current timestamp
    cb(null, `${originalName}-${timestamp}${extension}`); // Format: filename-timestamp.extension
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

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/upload", upload.single("csvFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.redirect(`/read/${req.file.filename}`);
});

app.get("/read/:filename", (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      console.log("URL:", data[Object.keys(data)[0]]); // Log each URL from CSV
      results.push(data);
    })
    .on("end", () => {
      console.log("Finished reading CSV file.");
      res.json(results); // Send data as JSON response
    })
    .on("error", (err) =>
      res.status(500).send("Error reading file: " + err.message)
    );
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
