const express = require("express");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { checkRobotsTxt } = require("../utils/robotsCheck");
const convertJsonToCsv = require("../utils/jsonToCsv");

const router = express.Router();

// Use environment variables for directory paths
const uploadDir = path.join(__dirname, "../uploads");
const downloadDir = path.join(__dirname, "../downloads");

// Ensure 'uploads' and 'downloads' folders exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`✅ Created missing directory: ${uploadDir}`);
}
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
  console.log(`✅ Created missing directory: ${downloadDir}`);
}

// Route to read CSV and check URLs
router.get("/read/:filename", async (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  const robotsPath = req.query.robotsPath; // Get robots.txt URL from request query

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  if (!robotsPath) {
    return res.status(400).send("robots.txt path is required.");
  }

  const urls = [];

  // Read CSV and collect URLs
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      if (urls.length >= 500) return; // Stop adding URLs after 500

      let url = data["URL"] || data[Object.keys(data)[0]]; // Extract URL

      if (url) {
        url = url.trim(); // Remove spaces
        url = url.replace(/^"(.*)"$/, "$1"); // Remove surrounding double quotes

        try {
          // Ensure valid URL format
          const parsedUrl = new URL(url);
          urls.push(parsedUrl.href); // Store cleaned, valid URL
        } catch (error) {
          console.error("❌ Invalid URL:", url, "Error:", error.message);
        }
      }
    })
    .on("end", async () => {
      console.log(`Finished reading ${urls.length} URLs from CSV.`);

      // Process each URL with the provided robots.txt path
      const results = await Promise.all(
        urls.map((url) => checkRobotsTxt(url, robotsPath))
      );

      console.log(`Finished checking ${urls.length} URLs.`);
      const responseData = results; // Store response in a const

      // Generate dynamic output filename
      let baseFileName = req.params.filename.replace(/\.csv$/, "");
      const outputFileName = `output-${baseFileName}.csv`;
      const outputFilePath = path.join(downloadDir, outputFileName);

      // Convert JSON response to CSV
      convertJsonToCsv(results, outputFilePath);

      // Ensure the download folder exists
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // Store the output file path in session or query for downloading later
      req.session.downloadFile = outputFileName;

      // Redirect to the download page
      res.redirect("/download.html");
      // res.json(responseData);
    })
    .on("error", (err) => {
      console.error("❌ Error reading CSV file:", err);
      res.status(500).send("Error reading file: " + err.message);
    });
});

router.get("/download", (req, res) => {
  const fileName = req.session.downloadFile;
  if (!fileName) {
    return res.status(400).send("No file available for download.");
  }

  const filePath = path.join(downloadDir, fileName);
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error("❌ Error downloading file:", err.message);
      res.status(500).send("Error downloading file.");
    }
  });
});

module.exports = router;
