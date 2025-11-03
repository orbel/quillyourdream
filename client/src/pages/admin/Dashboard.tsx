import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileImage, HelpCircle, Eye, Star } from "lucide-react";
import type { Artwork, Faq } from "@shared/schema";
import { RebuildButton } from "@/components/RebuildButton";

export default function AdminDashboard() {
  const { data: artworks, isLoading: artworksLoading } = useQuery<Artwork[]>({
    queryKey: ["/api/artworks"],
  });

  const { data: faqs, isLoading: faqsLoading } = useQuery<Faq[]>({
    queryKey: ["/api/faqs"],
  });

  const stats = [
    {
      title: "Total Artworks",
      value: artworks?.length || 0,
      icon: FileImage,
      description: "Pieces in portfolio",
    },
    {
      title: "Featured Artworks",
      value: artworks?.filter(a => a.featured).length || 0,
      icon: Star,
      description: "Currently featured",
    },
    {
      title: "Available",
      value: artworks?.filter(a => a.status === "available").length || 0,
      icon: Eye,
      description: "For sale",
    },
    {
      title: "FAQs",
      value: faqs?.length || 0,
      icon: HelpCircle,
      description: "Questions answered",
    },
  ];

  const isLoading = artworksLoading || faqsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-playfair font-bold" data-testid="heading-dashboard">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your art portfolio content
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted animate-pulse rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} data-testid={`card-stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`text-stat-value-${stat.title.toLowerCase().replace(' ', '-')}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RebuildButton />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/artworks"
              className="block p-3 rounded-md hover-elevate active-elevate-2 border"
              data-testid="link-quick-manage-artworks"
            >
              <div className="font-medium">Manage Artworks</div>
              <div className="text-sm text-muted-foreground">Add, edit, or remove artwork pieces</div>
            </a>
            <a
              href="/admin/faqs"
              className="block p-3 rounded-md hover-elevate active-elevate-2 border"
              data-testid="link-quick-manage-faqs"
            >
              <div className="font-medium">Manage FAQs</div>
              <div className="text-sm text-muted-foreground">Update frequently asked questions</div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Available</span>
                <span className="font-medium">
                  {artworks?.filter(a => a.status === "available").length || 0} / {artworks?.length || 0}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${artworks?.length ? ((artworks.filter(a => a.status === "available").length / artworks.length) * 100) : 0}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Featured</span>
                <span className="font-medium">
                  {artworks?.filter(a => a.featured).length || 0} / {artworks?.length || 0}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent"
                  style={{
                    width: `${artworks?.length ? ((artworks.filter(a => a.featured).length / artworks.length) * 100) : 0}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
