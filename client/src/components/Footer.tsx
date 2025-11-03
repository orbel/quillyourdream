import { Link } from "wouter";
import { Instagram, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-card-border mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold">Quill Your Dream</h3>
            <p className="text-muted-foreground text-sm">
              Exquisite paper quilling artworks by Shushan Aleksanyan, crafted with precision and passion in Los Angeles.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/" data-testid="link-footer-home">
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Home
                </span>
              </Link>
              <Link href="/portfolio" data-testid="link-footer-portfolio">
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Portfolio
                </span>
              </Link>
              <Link href="/about" data-testid="link-footer-about">
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  About
                </span>
              </Link>
              <Link href="/contact" data-testid="link-footer-contact">
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Contact
                </span>
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Los Angeles, CA</p>
              <a href="mailto:info@quillyourdream.com" className="hover:text-primary transition-colors block" data-testid="link-footer-email">
                info@quillyourdream.com
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider">Follow</h4>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="icon"
                asChild
                data-testid="button-footer-instagram"
              >
                <a href="https://instagram.com/quillyourdream" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-4 w-4" />
                  <span className="sr-only">Instagram</span>
                </a>
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
                data-testid="button-footer-etsy"
              >
                <a href="https://www.etsy.com/shop/QuillYourDream" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Etsy Shop</span>
                </a>
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
                data-testid="button-footer-email-icon"
              >
                <a href="mailto:info@quillyourdream.com">
                  <Mail className="h-4 w-4" />
                  <span className="sr-only">Email</span>
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Shushan Aleksanyan. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
