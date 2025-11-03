import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { useAccentColor } from "@/hooks/useAccentColor";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Portfolio from "@/pages/Portfolio";
import ArtworkDetail from "@/pages/ArtworkDetail";
import About from "@/pages/About";
import FAQPage from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminArtworks from "@/pages/admin/Artworks";
import AdminArtistInfo from "@/pages/admin/ArtistInfo";
import AdminFAQs from "@/pages/admin/FAQs";
import AdminUsers from "@/pages/admin/Users";
import AdminSettings from "@/pages/admin/Settings";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/artwork/:slug" component={ArtworkDetail} />
      <Route path="/about" component={About} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/contact" component={Contact} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/artworks" component={AdminArtworks} />
      <Route path="/admin/artist" component={AdminArtistInfo} />
      <Route path="/admin/faqs" component={AdminFAQs} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useAccentColor();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <ThemeProvider>
      <TooltipProvider>
        {isAdminRoute ? (
          <ProtectedRoute requireAdmin>
            <SidebarProvider style={sidebarStyle as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AdminSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <header className="flex items-center justify-between p-4 border-b gap-4">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-y-auto p-6">
                    <AdminRouter />
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </ProtectedRoute>
        ) : (
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1">
              <PublicRouter />
            </main>
            <Footer />
          </div>
        )}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
