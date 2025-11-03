import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/OptimizedImage";
import type { Artwork } from "@shared/schema";

interface ArtworkCardProps {
  artwork: Artwork;
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const primaryImage = artwork.images.find((img) => img.isPrimary) || artwork.images[0];

  return (
    <Link href={`/artwork/${artwork.slug}`} data-testid={`link-artwork-${artwork.slug}`}>
      <Card className="group overflow-hidden border-card-border hover-elevate transition-all duration-500 cursor-pointer h-full">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <OptimizedImage
            src={primaryImage.url}
            alt={primaryImage.alt}
            size="grid"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-sm font-medium">View Details</p>
            </div>
          </div>
          {artwork.featured && (
            <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}
          {artwork.status === "sold" && (
            <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
              Sold
            </Badge>
          )}
        </div>
        <div className="p-6 space-y-2">
          <h3 className="font-serif text-xl font-semibold line-clamp-1" data-testid={`text-artwork-title-${artwork.slug}`}>
            {artwork.title}
          </h3>
          <p className="text-sm text-muted-foreground">{artwork.medium}</p>
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {artwork.width}" × {artwork.height}"
            </p>
            {artwork.price && artwork.status === "available" && (
              <p className="text-sm font-semibold" data-testid={`text-artwork-price-${artwork.slug}`}>
                ${artwork.price.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
