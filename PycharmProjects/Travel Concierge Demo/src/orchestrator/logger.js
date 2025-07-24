// src/orchestrator/logger.js
module.exports = {
  info: (msg, meta) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, meta || '');
  },
  error: (msg, meta) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, meta || '');
  },
}; 