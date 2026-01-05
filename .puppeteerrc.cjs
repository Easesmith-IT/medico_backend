const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Directs Puppeteer to store the browser in a local folder
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
