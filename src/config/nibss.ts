import "dotenv/config";

const NIBSS_BASE_URL =
  process.env.NIBSS_BASE_URL || "https://nibssbyphoenix.onrender.com";

const NIBSS_API_KEY = process.env.NIBSS_API_KEY || "";

const NIBSS_API_SECRET = process.env.NIBSS_API_SECRET || "";

export {
  NIBSS_BASE_URL,
  NIBSS_API_KEY,
  NIBSS_API_SECRET,
};