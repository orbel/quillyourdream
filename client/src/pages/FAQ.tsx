import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MessageCircle } from "lucide-react";
import { SEO } from "@/components/SEO";
import { generateFAQPageSchema, generateBreadcrumbSchema } from "@/lib/schema";
import type { FAQ } from "@shared/schema";

export default function FAQPage() {
  const { data: faqs, isLoading } = useQuery<FAQ[]>({
    queryKey: ["/api/faqs"],
  });

  const faqSchema = faqs ? generateFAQPageSchema(faqs) : null;
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: window.location.origin },
    { name: "FAQ", url: `${window.location.origin}/faq` },
  ]);

  const schemas = faqSchema ? [breadcrumbSchema, faqSchema] : [breadcrumbSchema];

  const groupedFaqs = faqs?.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <SEO
        title="FAQ | Quill Your Dream"
        description="Frequently asked questions about commissioning paper quilling art, pricing, shipping, care instructions, and the creative process. Get all your questions answered."
        schema={schemas}
      />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h1 className="font-serif text-5xl lg:text-6xl font-bold">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about commissioning and purchasing paper quilling art
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : groupedFaqs && Object.keys(groupedFaqs).length > 0 ? (
          <div className="space-y-12">
            {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
              <div key={category}>
                <h2 className="font-serif text-2xl font-bold mb-6 capitalize">
                  {category}
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {categoryFaqs.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className="border border-card-border rounded-lg px-6 bg-card"
                      data-testid={`accordion-faq-${faq.id}`}
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-6">
                        <span className="font-semibold pr-4">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-6">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No FAQs available at the moment.</p>
          </div>
        )}

        <Card className="mt-16 p-8 lg:p-12 text-center space-y-6 border-card-border bg-primary/5">
          <MessageCircle className="h-12 w-12 text-primary mx-auto" />
          <h2 className="font-serif text-3xl font-bold">Still Have Questions?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Can't find the answer you're looking for? Feel free to reach out directly and I'll be happy to help.
          </p>
          <Button size="lg" asChild data-testid="button-contact-us">
            <Link href="/contact">
              Contact Me
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
