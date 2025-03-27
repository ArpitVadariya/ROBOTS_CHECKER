const express = require("express");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { checkRobotsTxt } = require("../utils/robotsCheck");

const router = express.Router();
const uploadDir = path.join(__dirname, "../uploads");

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
      const url = data["URL"] || data[Object.keys(data)[0]]; // Ensure correct column handling
      if (url) urls.push(url);
    })
    .on("end", async () => {
      console.log(`✅ Finished reading ${urls.length} URLs from CSV.`);

      // Process each URL with the provided robots.txt path
      const results = await Promise.all(
        urls.map((url) => checkRobotsTxt(url, robotsPath))
      );

      res.json(results); // Send JSON response
    })
    .on("error", (err) => {
      console.error("❌ Error reading CSV file:", err);
      res.status(500).send("Error reading file: " + err.message);
    });
});

module.exports = router;
