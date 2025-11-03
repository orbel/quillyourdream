import { useState, useEffect } from 'react';

interface ImageVariant {
  webp: string;
  jpeg: string;
  width: number;
  height: number;
}

interface ImageMetadata {
  variants: {
    thumbnail: ImageVariant;
    grid: ImageVariant;
    feature: ImageVariant;
    full: ImageVariant;
  };
  dominantColor: string;
  blurDataUrl: string;
}

interface OptimizedImageProps {
  src: string;
  alt: string;
  size?: 'thumbnail' | 'grid' | 'feature' | 'full';
  className?: string;
  eager?: boolean;
}

// Cache for image metadata
const metadataCache = new Map<string, ImageMetadata | null>();

function getImageFilename(src: string): string {
  // Extract filename from URL path
  const parts = src.split('/');
  const filename = parts[parts.length - 1];
  // Remove extension and add .jpeg since that's what's in summary
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  return `${nameWithoutExt}.jpeg`;
}

async function loadImageMetadata(src: string): Promise<ImageMetadata | null> {
  const filename = getImageFilename(src);
  
  if (metadataCache.has(filename)) {
    return metadataCache.get(filename) || null;
  }

  try {
    const response = await fetch('/attached_assets/optimized/summary.json');
    if (!response.ok) {
      console.warn('Failed to load image optimization summary');
      metadataCache.set(filename, null);
      return null;
    }
    
    const summary = await response.json();
    const metadata = summary[filename];
    
    if (!metadata) {
      console.warn(`No optimized variants found for ${filename}`);
      metadataCache.set(filename, null);
      return null;
    }
    
    metadataCache.set(filename, metadata);
    return metadata;
  } catch (error) {
    console.error('Error loading image metadata:', error);
    metadataCache.set(filename, null);
    return null;
  }
}

export function OptimizedImage({ 
  src, 
  alt, 
  size = 'grid',
  className = '',
  eager = false
}: OptimizedImageProps) {
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metadataFailed, setMetadataFailed] = useState(false);

  useEffect(() => {
    loadImageMetadata(src).then(data => {
      if (data) {
        setMetadata(data);
      } else {
        setMetadataFailed(true);
      }
      setIsLoading(false);
    });
  }, [src]);

  // Show blur placeholder while loading metadata
  if (isLoading) {
    return (
      <div 
        className={className}
        style={{
          background: 'linear-gradient(to bottom, rgb(243, 244, 246), rgb(229, 231, 235))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
    );
  }

  // Fallback to original image ONLY if metadata failed to load
  if (metadataFailed || !metadata) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    );
  }

  const variant = metadata.variants[size];

  return (
    <picture>
      <source
        type="image/webp"
        srcSet={`
          ${metadata.variants.thumbnail.webp} ${metadata.variants.thumbnail.width}w,
          ${metadata.variants.grid.webp} ${metadata.variants.grid.width}w,
          ${metadata.variants.feature.webp} ${metadata.variants.feature.width}w,
          ${metadata.variants.full.webp} ${metadata.variants.full.width}w
        `}
        sizes={
          size === 'thumbnail' ? '480px' :
          size === 'grid' ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' :
          size === 'feature' ? '(max-width: 1024px) 100vw, 1440px' :
          '2048px'
        }
      />
      <source
        type="image/jpeg"
        srcSet={`
          ${metadata.variants.thumbnail.jpeg} ${metadata.variants.thumbnail.width}w,
          ${metadata.variants.grid.jpeg} ${metadata.variants.grid.width}w,
          ${metadata.variants.feature.jpeg} ${metadata.variants.feature.width}w,
          ${metadata.variants.full.jpeg} ${metadata.variants.full.width}w
        `}
        sizes={
          size === 'thumbnail' ? '480px' :
          size === 'grid' ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' :
          size === 'feature' ? '(max-width: 1024px) 100vw, 1440px' :
          '2048px'
        }
      />
      <img
        src={variant.jpeg}
        alt={alt}
        width={variant.width}
        height={variant.height}
        className={className}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={{
          backgroundColor: metadata.dominantColor,
        }}
      />
    </picture>
  );
}
