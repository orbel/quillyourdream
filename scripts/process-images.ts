import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface ImageVariant {
  size: number;
  name: string;
}

const VARIANTS: ImageVariant[] = [
  { size: 480, name: 'thumbnail' },
  { size: 960, name: 'grid' },
  { size: 1440, name: 'feature' },
  { size: 2048, name: 'full' },
];

const QUALITY = {
  webp: 85,
  jpeg: 90,
};

interface ProcessedImage {
  original: string;
  variants: {
    thumbnail: { webp: string; jpeg: string; width: number; height: number };
    grid: { webp: string; jpeg: string; width: number; height: number };
    feature: { webp: string; jpeg: string; width: number; height: number };
    full: { webp: string; jpeg: string; width: number; height: number };
  };
  dominantColor: string;
  blurDataUrl: string;
  checksum: string;
}

async function getFileChecksum(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash('md5').update(buffer).digest('hex');
}

async function generateBlurDataUrl(imagePath: string): Promise<string> {
  const buffer = await sharp(imagePath)
    .resize(20, 20, { fit: 'inside' })
    .webp({ quality: 20 })
    .toBuffer();
  
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

async function getDominantColor(imagePath: string): Promise<string> {
  const { dominant } = await sharp(imagePath).stats();
  return `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`;
}

async function processImage(
  inputPath: string,
  outputDir: string,
  slug: string
): Promise<ProcessedImage> {
  console.log(`Processing image: ${inputPath}`);

  // Get original image metadata
  const metadata = await sharp(inputPath).metadata();
  const checksum = await getFileChecksum(inputPath);

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Generate blur placeholder and dominant color
  const [blurDataUrl, dominantColor] = await Promise.all([
    generateBlurDataUrl(inputPath),
    getDominantColor(inputPath),
  ]);

  const result: ProcessedImage = {
    original: inputPath,
    variants: {
      thumbnail: { webp: '', jpeg: '', width: 0, height: 0 },
      grid: { webp: '', jpeg: '', width: 0, height: 0 },
      feature: { webp: '', jpeg: '', width: 0, height: 0 },
      full: { webp: '', jpeg: '', width: 0, height: 0 },
    },
    dominantColor,
    blurDataUrl,
    checksum,
  };

  // Process each variant
  for (const variant of VARIANTS) {
    const image = sharp(inputPath);
    const resizedMetadata = await image
      .resize(variant.size, variant.size, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer({ resolveWithObject: true });

    const width = resizedMetadata.info.width;
    const height = resizedMetadata.info.height;

    // Generate WebP version
    const webpPath = path.join(outputDir, `${variant.name}.webp`);
    await sharp(inputPath)
      .resize(variant.size, variant.size, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: QUALITY.webp })
      .toFile(webpPath);

    // Generate JPEG version
    const jpegPath = path.join(outputDir, `${variant.name}.jpg`);
    await sharp(inputPath)
      .resize(variant.size, variant.size, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: QUALITY.jpeg, progressive: true })
      .toFile(jpegPath);

    // Store relative paths
    const relativeWebp = path.relative('attached_assets', webpPath);
    const relativeJpeg = path.relative('attached_assets', jpegPath);

    result.variants[variant.name as keyof typeof result.variants] = {
      webp: `/attached_assets/${relativeWebp}`,
      jpeg: `/attached_assets/${relativeJpeg}`,
      width,
      height,
    };

    console.log(`  ✓ Generated ${variant.name}: ${width}x${height}`);
  }

  // Save metadata
  const metadataPath = path.join(outputDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(result, null, 2));

  return result;
}

async function processAllImages() {
  const assetsDir = path.join(process.cwd(), 'attached_assets');
  const files = await fs.readdir(assetsDir);
  
  const imageFiles = files.filter(file => 
    /\.(jpg|jpeg|png)$/i.test(file) && !file.startsWith('.')
  );

  console.log(`Found ${imageFiles.length} images to process\n`);

  const results: Record<string, ProcessedImage> = {};

  for (const file of imageFiles) {
    const inputPath = path.join(assetsDir, file);
    const slug = path.parse(file).name;
    const outputDir = path.join(assetsDir, 'optimized', slug);

    try {
      // Check if already processed with same checksum
      const metadataPath = path.join(outputDir, 'metadata.json');
      const currentChecksum = await getFileChecksum(inputPath);

      let skipProcessing = false;
      try {
        const existingMetadata = JSON.parse(
          await fs.readFile(metadataPath, 'utf-8')
        );
        if (existingMetadata.checksum === currentChecksum) {
          console.log(`⏭️  Skipping ${file} (unchanged)`);
          results[file] = existingMetadata;
          skipProcessing = true;
        }
      } catch (err) {
        // Metadata doesn't exist, process normally
      }

      if (!skipProcessing) {
        const result = await processImage(inputPath, outputDir, slug);
        results[file] = result;
        console.log(`✅ Completed ${file}\n`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  // Save summary
  const summaryPath = path.join(assetsDir, 'optimized', 'summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(results, null, 2));
  
  console.log('\n✨ Image processing complete!');
  console.log(`Summary saved to: ${summaryPath}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processAllImages().catch(console.error);
}

export { processImage, processAllImages };
