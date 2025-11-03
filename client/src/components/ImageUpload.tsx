import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Upload, Sparkles, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface ArtworkImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface ImageUploadProps {
  value: ArtworkImage[];
  onChange: (images: ArtworkImage[]) => void;
}

interface CropState {
  imageIndex: number;
  imageSrc: string;
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPixels: any;
  fileName: string;
  alt: string;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [cropState, setCropState] = useState<CropState | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    if (cropState) {
      setCropState({ ...cropState, croppedAreaPixels });
    }
  }, [cropState]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropState({
        imageIndex: -1, // New image
        imageSrc: reader.result as string,
        crop: { x: 0, y: 0 },
        zoom: 1,
        croppedAreaPixels: null,
        fileName: file.name,
        alt: "",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCrop = async () => {
    if (!cropState || !cropState.croppedAreaPixels) return;

    setUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(cropState.imageSrc);
      const blob = await response.blob();

      // Create form data with crop info
      const formData = new FormData();
      formData.append("image", blob, cropState.fileName);
      formData.append("cropX", cropState.croppedAreaPixels.x.toString());
      formData.append("cropY", cropState.croppedAreaPixels.y.toString());
      formData.append("cropWidth", cropState.croppedAreaPixels.width.toString());
      formData.append("cropHeight", cropState.croppedAreaPixels.height.toString());

      // Upload to server
      const uploadResponse = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const data = await uploadResponse.json();
      
      // Add to images array
      const newImage: ArtworkImage = {
        url: data.url,
        alt: cropState.alt || cropState.fileName,
        isPrimary: value.length === 0, // First image is primary
      };

      onChange([...value, newImage]);
      setCropState(null);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSkipCrop = async () => {
    if (!cropState) return;

    setUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(cropState.imageSrc);
      const blob = await response.blob();

      // Create form data without crop info (upload original)
      const formData = new FormData();
      formData.append("image", blob, cropState.fileName);

      // Upload to server
      const uploadResponse = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const data = await uploadResponse.json();
      
      // Add to images array
      const newImage: ArtworkImage = {
        url: data.url,
        alt: cropState.alt || cropState.fileName,
        isPrimary: value.length === 0, // First image is primary
      };

      onChange([...value, newImage]);
      setCropState(null);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    // If we removed the primary image, make the first remaining image primary
    if (value[index].isPrimary && newImages.length > 0) {
      newImages[0] = { ...newImages[0], isPrimary: true };
    }
    onChange(newImages);
  };

  const handleSetPrimary = (index: number) => {
    const newImages = value.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(newImages);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...value];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    onChange(newImages);
  };

  const handleMoveDown = (index: number) => {
    if (index === value.length - 1) return;
    const newImages = [...value];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
          data-testid="input-file-upload"
        />
        <label htmlFor="image-upload">
          <Button type="button" variant="outline" asChild data-testid="button-upload-image">
            <span className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </span>
          </Button>
        </label>
        <p className="text-sm text-muted-foreground">
          {value.length === 0 ? "No images uploaded" : `${value.length} image${value.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {value.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {value.map((image, index) => (
            <Card key={index} className="relative p-3 space-y-2" data-testid={`card-image-${index}`}>
              <div className="relative aspect-square bg-muted rounded-md overflow-hidden">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                  data-testid={`img-preview-${index}`}
                />
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Primary
                  </div>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => handleRemove(index)}
                  data-testid={`button-remove-${index}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Input
                  placeholder="Alt text"
                  value={image.alt}
                  onChange={(e) => {
                    const newImages = [...value];
                    newImages[index] = { ...newImages[index], alt: e.target.value };
                    onChange(newImages);
                  }}
                  data-testid={`input-alt-${index}`}
                />
                
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`primary-${index}`} className="text-xs">Primary</Label>
                    <Switch
                      id={`primary-${index}`}
                      checked={image.isPrimary}
                      onCheckedChange={() => handleSetPrimary(index)}
                      data-testid={`switch-primary-${index}`}
                    />
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      data-testid={`button-move-up-${index}`}
                    >
                      <GripVertical className="w-4 h-4 rotate-180" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === value.length - 1}
                      data-testid={`button-move-down-${index}`}
                    >
                      <GripVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {cropState && (
        <Dialog open={!!cropState} onOpenChange={() => setCropState(null)}>
          <DialogContent className="max-w-2xl" data-testid="dialog-crop">
            <DialogHeader>
              <DialogTitle>Crop Image (Optional)</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative h-96 bg-muted rounded-md overflow-hidden">
                <Cropper
                  image={cropState.imageSrc}
                  crop={cropState.crop}
                  zoom={cropState.zoom}
                  onCropChange={(crop) => setCropState({ ...cropState, crop })}
                  onZoomChange={(zoom) => setCropState({ ...cropState, zoom })}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="space-y-2">
                <Label>Zoom</Label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={cropState.zoom}
                  onChange={(e) => setCropState({ ...cropState, zoom: Number(e.target.value) })}
                  className="w-full"
                  data-testid="input-zoom"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt-text">Image Description (Alt Text)</Label>
                <Input
                  id="alt-text"
                  placeholder="Describe the image..."
                  value={cropState.alt}
                  onChange={(e) => setCropState({ ...cropState, alt: e.target.value })}
                  data-testid="input-crop-alt"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCropState(null)} data-testid="button-cancel-crop">
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="secondary"
                onClick={handleSkipCrop} 
                disabled={uploading}
                data-testid="button-skip-crop"
              >
                {uploading ? "Uploading..." : "Upload Original"}
              </Button>
              <Button 
                type="button" 
                onClick={handleSaveCrop} 
                disabled={uploading}
                data-testid="button-save-crop"
              >
                {uploading ? "Uploading..." : "Crop & Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
