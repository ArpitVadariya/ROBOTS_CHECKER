const axios = require("axios");

// Function to fetch and parse robots.txt rules
async function fetchAndParseRobotsTxt(robotsTxtUrl) {
  try {
    const response = await axios.get(robotsTxtUrl);
    const robotsTxt = response.data;
    return parseRobotsTxt(robotsTxt, "*"); // Extract rules for all user agents
  } catch (error) {
    console.error(`❌ Failed to fetch robots.txt: ${error.message}`);
    return [];
  }
}

// Function to parse robots.txt content
function parseRobotsTxt(robotsTxt, userAgent) {
  const lines = robotsTxt.split("\n");
  const rules = [];
  let isMatchingAgent = false;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith("#") || line === "") continue;

    const parts = line.split(":");
    if (parts.length < 2) continue;

    const key = parts[0].trim().toLowerCase();
    const value = parts.slice(1).join(":").trim();

    if (key === "user-agent") {
      isMatchingAgent =
        value === "*" || value.toLowerCase() === userAgent.toLowerCase();
    } else if ((key === "disallow" || key === "allow") && isMatchingAgent) {
      if (value !== "" || key === "allow") {
        rules.push({ type: key, path: value });
      }
    }
  }
  return rules;
}

// Function to extract the path from a URL
function getPathFromUrl(url) {
  try {
    const match = url.match(/^https?:\/\/[^\/]+(\/[^?#]*)?(\?[^#]*)?/i);
    const path = match[1] || "/";
    const query = match[2] || "";
    return path + query;
  } catch (e) {
    console.error("❌ Invalid URL:", url, "Error:", e.message);
    return "";
  }
}

// Function to check if a URL is blocked by robots.txt
function getBlockingRule(path, rules) {
  let matchedRule = null;
  let matchedLength = -1;

  for (let rule of rules) {
    // Convert robots.txt wildcard rule into RegExp
    const regex = new RegExp(
      "^" +
        rule.path
          .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape special regex characters
          .replace(/\*/g, ".*") // Convert * to .*
    );

    if (regex.test(path)) {
      if (rule.path.length > matchedLength) {
        matchedRule = `${capitalize(rule.type)}: ${rule.path}`;
        matchedLength = rule.path.length;
      }
    }
  }

  return matchedRule;
}

// Function to capitalize first letter of a string
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Main function to check URLs against robots.txt
async function checkRobotsTxt(url, robotsTxtUrl) {
  const rules = await fetchAndParseRobotsTxt(robotsTxtUrl);
  const path = getPathFromUrl(url);
  const blockingRule = getBlockingRule(path, rules);

  return {
    url,
    path,
    robotsTxtUrl,
    rule: blockingRule || "Allowed",
  };
}

module.exports = { checkRobotsTxt };
