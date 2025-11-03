import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertArtistInfoSchema, type ArtistInfo, type InsertArtistInfo } from "@shared/schema";

export default function AdminArtistInfo() {
  const { toast } = useToast();

  const { data: artist, isLoading } = useQuery<ArtistInfo>({
    queryKey: ["/api/artist"],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertArtistInfo> }) =>
      apiRequest("PATCH", `/api/admin/artist/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artist"] });
      toast({
        title: "Success",
        description: "Artist info updated successfully",
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

  const form = useForm<InsertArtistInfo>({
    resolver: zodResolver(insertArtistInfoSchema),
    values: artist || {
      name: "",
      tagline: "",
      bio: "",
      location: "",
      email: "",
      phone: "",
      social: {},
      profileImage: "",
      exhibitions: [],
    },
  });

  const handleSubmit = (data: InsertArtistInfo) => {
    if (!artist?.id) return;
    updateMutation.mutate({ id: artist.id, data });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-64" />
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted animate-pulse rounded w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-playfair font-bold" data-testid="heading-artist-info">Artist Information</h1>
        <p className="text-muted-foreground mt-2">
          Update your artist profile and contact information
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your name, tagline, and biography
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A brief tagline about your art"
                        {...field}
                        data-testid="input-tagline"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biography</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell your story..."
                        rows={6}
                        {...field}
                        data-testid="input-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How people can reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Los Angeles, CA"
                        {...field}
                        data-testid="input-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile & Social</CardTitle>
              <CardDescription>
                Your profile image and social media links
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="profileImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="/assets/profile.jpg"
                        {...field}
                        data-testid="input-profile-image"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="social"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Media (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='{"instagram": "https://instagram.com/...","etsy": "https://etsy.com/..."}'
                        rows={4}
                        value={typeof field.value === "string" ? field.value : JSON.stringify(field.value, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            field.onChange(parsed);
                          } catch {
                            field.onChange(e.target.value);
                          }
                        }}
                        data-testid="input-social"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      JSON object with social media links
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exhibitions</CardTitle>
              <CardDescription>
                Your exhibition history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="exhibitions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exhibitions (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='[{"year": "2024", "title": "Exhibition Name", "location": "Gallery Name"}]'
                        rows={6}
                        value={typeof field.value === "string" ? field.value : JSON.stringify(field.value, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            field.onChange(parsed);
                          } catch {
                            field.onChange(e.target.value);
                          }
                        }}
                        data-testid="input-exhibitions"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      JSON array of exhibition objects
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              data-testid="button-save"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
