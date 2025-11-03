import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join } from 'path';

async function processLogo() {
  const inputPath = join(process.cwd(), 'attached_assets/IMG_8811_1760890640286.png');
  const outputDir = join(process.cwd(), 'client/public');
  
  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });
  
  console.log('Processing logo...');
  
  // Load and trim the logo
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  console.log(`Original size: ${metadata.width}x${metadata.height}`);
  
  // Trim transparent parts
  const trimmed = await image
    .trim()
    .toBuffer();
  
  const trimmedImage = sharp(trimmed);
  const trimmedMetadata = await trimmedImage.metadata();
  
  console.log(`Trimmed size: ${trimmedMetadata.width}x${trimmedMetadata.height}`);
  
  // Save trimmed logo
  await trimmedImage
    .toFile(join(outputDir, 'logo.png'));
  
  console.log('✅ Saved trimmed logo: client/public/logo.png');
  
  // Generate favicon sizes
  const faviconSizes = [16, 32, 192, 512];
  
  for (const size of faviconSizes) {
    await sharp(trimmed)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(join(outputDir, `favicon-${size}x${size}.png`));
    
    console.log(`✅ Generated favicon-${size}x${size}.png`);
  }
  
  // Generate traditional favicon.ico (32x32)
  await sharp(trimmed)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(join(outputDir, 'favicon.ico'));
  
  console.log('✅ Generated favicon.ico');
  
  console.log('\n✨ Logo processing complete!');
}

processLogo().catch(console.error);
