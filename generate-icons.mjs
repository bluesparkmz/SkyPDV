import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';

const INPUT = './public/logo.png';
const OUTPUT_DIR = './public/icons';

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log('🖼️  Gerando ícones PWA a partir de logo.png...');

  for (const size of sizes) {
    const outputPath = `${OUTPUT_DIR}/icon-${size}x${size}.png`;
    await sharp(INPUT)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(outputPath);
    console.log(`  ✅ icon-${size}x${size}.png`);
  }

  // Apple touch icon (180x180)
  await sharp(INPUT)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(`${OUTPUT_DIR}/apple-touch-icon.png`);
  console.log('  ✅ apple-touch-icon.png (180x180)');

  // maskable icon com padding (512x512)
  await sharp(INPUT)
    .resize(410, 410, { fit: 'contain', background: { r: 79, g: 70, b: 229, alpha: 1 } })
    .extend({ top: 51, bottom: 51, left: 51, right: 51, background: { r: 79, g: 70, b: 229, alpha: 1 } })
    .png()
    .toFile(`${OUTPUT_DIR}/icon-maskable-512x512.png`);
  console.log('  ✅ icon-maskable-512x512.png (maskable)');

  console.log('\n🎉 Todos os ícones gerados em ./public/icons/');
}

generateIcons().catch(console.error);
