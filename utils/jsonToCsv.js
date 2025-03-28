const fs = require("fs");
const { parse } = require("json2csv");

function convertJsonToCsv(jsonData, filePath) {
  try {
    // Ensure jsonData is an array
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      throw new Error("Invalid or empty JSON data.");
    }

    // Extract fields from the first object
    const fields = Object.keys(jsonData[0]);
    const opts = { fields };

    // Convert JSON to CSV
    const csv = parse(jsonData, opts);

    // Write CSV file
    fs.writeFileSync(filePath, csv);
    console.log(`✅ CSV file saved: ${filePath}`);

    return filePath; // Return file path for further use
  } catch (err) {
    console.error("❌ Error converting JSON to CSV:", err.message);
    return null;
  }
}

// Export function for use in other files
module.exports = convertJsonToCsv;
