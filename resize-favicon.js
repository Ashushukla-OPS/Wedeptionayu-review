const sharp = require('sharp');

async function processIcons() {
  try {
    // 192x192 is a multiple of 48, which Google recommends
    await sharp('public/icon.png')
      .resize(192, 192)
      .toFile('app/icon.png');
    console.log('Successfully generated app/icon.png (192x192)');

    // In modern Next.js App Router, the app/icon.png is sufficient 
    // and correctly generates the <link rel="icon" ...> tag for Google
  } catch (err) {
    console.error('Error generating icon:', err);
  }
}

processIcons();
