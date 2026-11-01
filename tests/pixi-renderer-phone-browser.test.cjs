'use strict';
// The original real-browser Pixi/Canvas recovery and Mage overlay journey,
// executed only on the phone viewport. Desktop runs in the sibling test file.
// This is a separate process, not a skipped assertion or a relaxed timeout.
process.env.PIXI_BROWSER_DEVICE = 'phone';
require('./pixi-renderer-browser.test.cjs');
