const fs = require("fs");
const path = require("path");

/**
 * Creates a CSV file from an array of manual URLs with a timestamped filename.
 * @param {string[]} urlsArray - Array of URLs
 * @param {string} uploadDir - Directory to save the CSV
 * @returns {Promise<string>} - CSV filename
 */
function createCsvFromManual(urlsArray, uploadDir = "uploads") {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(urlsArray)) {
      return reject(new Error("Provided data is not a valid array."));
    }

    // Add "URLs" header as the first row
    const csvRows = ['"URLs"', ...urlsArray.map((url) => `"${url}"`)];
    const csvContent = csvRows.join("\n");

    // Generate timestamped filename
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/T/, "-")
      .replace(/:/g, "-")
      .replace(/\..+/, "");
    const filename = `manual-urls-${timestamp}.csv`;

    const filePath = path.join(__dirname, "..", uploadDir, filename);

    fs.writeFile(filePath, csvContent, (err) => {
      if (err) return reject(err);
      resolve(filename);
    });
  });
}

module.exports = createCsvFromManual;
