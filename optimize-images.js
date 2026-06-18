import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const RAW_DIR = path.join(process.cwd(), 'src/assets/raw-images');
const OUT_DIR = path.join(process.cwd(), 'public/images');

// Ensure directories exist
if (!fs.existsSync(RAW_DIR)) {
  console.log(`[Init] Creating raw-images directory: ${RAW_DIR}`);
  fs.mkdirSync(RAW_DIR, { recursive: true });
}

if (!fs.existsSync(OUT_DIR)) {
  console.log(`[Init] Creating output images directory: ${OUT_DIR}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function optimizeImages() {
  try {
    const files = fs.readdirSync(RAW_DIR);
    const imageExtensions = ['.png', '.jpg', '.jpeg'];
    
    const targetFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    if (targetFiles.length === 0) {
      console.log('No raw images (.png, .jpg, .jpeg) found in raw-images directory.');
      return;
    }

    console.log(`Found ${targetFiles.length} image(s) to optimize...`);

    for (const file of targetFiles) {
      const inputPath = path.join(RAW_DIR, file);
      // Remove original extension, convert name to lowercase, and append .webp
      const nameWithoutExt = path.basename(file, path.extname(file));
      const lowercaseName = nameWithoutExt.toLowerCase();
      const outputPath = path.join(OUT_DIR, `${lowercaseName}.webp`);

      console.log(`Optimizing: ${file} -> ${lowercaseName}.webp`);

      await sharp(inputPath)
        .resize(512, 512, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 75 })
        .toFile(outputPath);

      console.log(`Saved: ${outputPath}`);
    }

    console.log('Image optimization finished successfully.');
  } catch (error) {
    console.error('Error during image optimization process:', error);
    process.exit(1);
  }
}

await optimizeImages();
