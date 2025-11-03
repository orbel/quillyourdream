import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertArtworkSchema, type Artwork, type InsertArtwork } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ImageUpload";

export default function AdminArtworks() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [deletingArtwork, setDeletingArtwork] = useState<Artwork | null>(null);
  const { toast } = useToast();

  const { data: artworks, isLoading } = useQuery<Artwork[]>({
    queryKey: ["/api/artworks"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertArtwork) =>
      apiRequest("POST", "/api/admin/artworks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artworks"] });
      setIsCreateOpen(false);
      toast({
        title: "Success",
        description: "Artwork created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertArtwork> }) =>
      apiRequest("PATCH", `/api/admin/artworks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artworks"] });
      setEditingArtwork(null);
      toast({
        title: "Success",
        description: "Artwork updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/admin/artworks/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artworks"] });
      setDeletingArtwork(null);
      toast({
        title: "Success",
        description: "Artwork deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-playfair font-bold" data-testid="heading-artworks">Manage Artworks</h1>
          <p className="text-muted-foreground mt-2">
            Add, edit, or remove artwork pieces from your portfolio
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-artwork">
              <Plus className="w-4 h-4 mr-2" />
              Add Artwork
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Artwork</DialogTitle>
              <DialogDescription>
                Create a new piece for your portfolio
              </DialogDescription>
            </DialogHeader>
            <ArtworkForm
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <div className="aspect-square bg-muted animate-pulse" />
              <CardHeader>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {artworks?.map((artwork) => (
            <Card key={artwork.id} data-testid={`card-artwork-${artwork.id}`}>
              <div className="aspect-square overflow-hidden bg-muted">
                {artwork.images && Array.isArray(artwork.images) && artwork.images.length > 0 && (
                  <img
                    src={(artwork.images as any[])[0].url}
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{artwork.title}</CardTitle>
                  {artwork.featured && (
                    <Star className="w-4 h-4 text-accent fill-accent" />
                  )}
                </div>
                <CardDescription>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary">{artwork.category}</Badge>
                    <Badge variant={artwork.status === "available" ? "default" : "outline"}>
                      {artwork.status}
                    </Badge>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex gap-2">
                <Dialog
                  open={editingArtwork?.id === artwork.id}
                  onOpenChange={(open) => setEditingArtwork(open ? artwork : null)}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" data-testid={`button-edit-${artwork.id}`}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Artwork</DialogTitle>
                      <DialogDescription>
                        Update the details of {artwork.title}
                      </DialogDescription>
                    </DialogHeader>
                    <ArtworkForm
                      artwork={artwork}
                      onSubmit={(data) =>
                        updateMutation.mutate({ id: artwork.id!, data })
                      }
                      isPending={updateMutation.isPending}
                      onCancel={() => setEditingArtwork(null)}
                    />
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={deletingArtwork?.id === artwork.id}
                  onOpenChange={(open) => setDeletingArtwork(open ? artwork : null)}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm" data-testid={`button-delete-${artwork.id}`}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Artwork</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete "{artwork.title}"? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDeletingArtwork(null)}
                        data-testid="button-cancel-delete"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(artwork.id!)}
                        disabled={deleteMutation.isPending}
                        data-testid="button-confirm-delete"
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface ArtworkFormProps {
  artwork?: Artwork;
  onSubmit: (data: InsertArtwork) => void;
  isPending: boolean;
  onCancel: () => void;
}

function ArtworkForm({ artwork, onSubmit, isPending, onCancel }: ArtworkFormProps) {
  const form = useForm<InsertArtwork>({
    resolver: zodResolver(insertArtworkSchema),
    defaultValues: artwork ? {
      ...artwork,
      depth: artwork.depth || undefined,
      price: artwork.price || undefined,
    } : {
      title: "",
      slug: "",
      description: "",
      medium: "",
      artform: "Paper Quilling",
      dateCreated: new Date().getFullYear().toString(),
      width: 0,
      height: 0,
      depth: undefined,
      price: undefined,
      status: "available",
      category: "original",
      images: [],
      featured: false,
    },
  });

  const handleSubmit = (data: InsertArtwork) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Artwork title" {...field} data-testid="input-title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="artwork-slug" {...field} data-testid="input-slug" />
                </FormControl>
                <FormDescription className="text-xs">
                  URL-friendly identifier
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the artwork..."
                  rows={4}
                  {...field}
                  data-testid="input-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="medium"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medium</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Paper, Cardstock" {...field} data-testid="input-medium" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="artform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Art Form</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Paper Quilling" {...field} data-testid="input-artform" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateCreated"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Created</FormLabel>
                <FormControl>
                  <Input placeholder="2024" {...field} data-testid="input-date-created" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <FormField
            control={form.control}
            name="width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width (inches)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    data-testid="input-width"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (inches)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    data-testid="input-height"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="depth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Depth (inches)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    data-testid="input-depth"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    data-testid="input-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="original">Original</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                    <SelectItem value="exhibition">Exhibition</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="exhibition">Exhibition</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Featured Artwork</FormLabel>
                <FormDescription>
                  Display this artwork on the homepage
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="switch-featured"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Images</FormLabel>
              <FormControl>
                <ImageUpload 
                  value={Array.isArray(field.value) ? field.value : []} 
                  onChange={field.onChange} 
                />
              </FormControl>
              <FormDescription className="text-xs">
                Upload images for this artwork. The first image will be the primary display image.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-submit">
            {isPending ? "Saving..." : artwork ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
