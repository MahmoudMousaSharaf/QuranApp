const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourceImage = path.join(__dirname, 'icon of app', '6025910030953025040.jpg');
const assetsDir = path.join(__dirname, 'assets');

async function generateIcons() {
  console.log('Generating app icons from:', sourceImage);

  // App icon (iOS) - must be 1024x1024 PNG
  await sharp(sourceImage)
    .resize(1024, 1024, { fit: 'cover', position: 'center' })
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('Generated: icon.png (1024x1024)');

  // Adaptive icon (Android) - 1024x1024 PNG with padding for safe zone
  // Android adaptive icons need the foreground image to be 108dp (432x432 visible area within 1024x1024)
  // We create a 1024x1024 image with the icon centered at ~66% size
  await sharp(sourceImage)
    .resize(680, 680, { fit: 'cover', position: 'center' })
    .extend({
      top: 172,
      bottom: 172,
      left: 172,
      right: 172,
      background: { r: 13, g: 148, b: 136, alpha: 1 } // #0d9488 teal
    })
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('Generated: adaptive-icon.png (1024x1024 with padding)');

  // Splash screen - 1242x2436 (iPhone X resolution), contain mode
  // The splash should have the icon centered on the background color
  const splashBg = { r: 13, g: 148, b: 136, alpha: 1 }; // #0d9488
  await sharp(sourceImage)
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .extend({
      top: 1018,
      bottom: 1018,
      left: 421,
      right: 421,
      background: splashBg
    })
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));
  console.log('Generated: splash.png (1242x2436)');

  // Favicon - 48x48 PNG
  await sharp(sourceImage)
    .resize(48, 48, { fit: 'cover', position: 'center' })
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('Generated: favicon.png (48x48)');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
