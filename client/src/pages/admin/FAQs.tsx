import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertFaqSchema, type Faq, type InsertFaq } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function AdminFAQs() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [deletingFaq, setDeletingFaq] = useState<Faq | null>(null);
  const { toast } = useToast();

  const { data: faqs, isLoading } = useQuery<Faq[]>({
    queryKey: ["/api/faqs"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertFaq) =>
      apiRequest("POST", "/api/admin/faqs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      setIsCreateOpen(false);
      toast({
        title: "Success",
        description: "FAQ created successfully",
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
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertFaq> }) =>
      apiRequest("PATCH", `/api/admin/faqs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      setEditingFaq(null);
      toast({
        title: "Success",
        description: "FAQ updated successfully",
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
      apiRequest("DELETE", `/api/admin/faqs/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      setDeletingFaq(null);
      toast({
        title: "Success",
        description: "FAQ deleted successfully",
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

  const faqsByCategory = faqs?.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, Faq[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-playfair font-bold" data-testid="heading-faqs">Manage FAQs</h1>
          <p className="text-muted-foreground mt-2">
            Add, edit, or remove frequently asked questions
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-faq">
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New FAQ</DialogTitle>
              <DialogDescription>
                Create a new frequently asked question
              </DialogDescription>
            </DialogHeader>
            <FAQForm
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {faqsByCategory && Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
            <div key={category}>
              <h2 className="text-xl font-playfair font-semibold mb-4 capitalize">
                {category}
              </h2>
              <div className="space-y-3">
                {categoryFaqs.map((faq) => (
                  <Card key={faq.id} data-testid={`card-faq-${faq.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-base">{faq.question}</CardTitle>
                          <CardDescription className="mt-2">
                            {faq.answer}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{faq.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex gap-2">
                      <Dialog
                        open={editingFaq?.id === faq.id}
                        onOpenChange={(open) => setEditingFaq(open ? faq : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" data-testid={`button-edit-${faq.id}`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit FAQ</DialogTitle>
                            <DialogDescription>
                              Update the FAQ details
                            </DialogDescription>
                          </DialogHeader>
                          <FAQForm
                            faq={faq}
                            onSubmit={(data) =>
                              updateMutation.mutate({ id: faq.id, data })
                            }
                            isPending={updateMutation.isPending}
                            onCancel={() => setEditingFaq(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      <Dialog
                        open={deletingFaq?.id === faq.id}
                        onOpenChange={(open) => setDeletingFaq(open ? faq : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm" data-testid={`button-delete-${faq.id}`}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete FAQ</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this FAQ? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setDeletingFaq(null)}
                              data-testid="button-cancel-delete"
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => deleteMutation.mutate(faq.id)}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface FAQFormProps {
  faq?: Faq;
  onSubmit: (data: InsertFaq) => void;
  isPending: boolean;
  onCancel: () => void;
}

function FAQForm({ faq, onSubmit, isPending, onCancel }: FAQFormProps) {
  const form = useForm<InsertFaq>({
    resolver: zodResolver(insertFaqSchema),
    defaultValues: faq || {
      question: "",
      answer: "",
      category: "general",
      order: 0,
    },
  });

  const handleSubmit = (data: InsertFaq) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question</FormLabel>
              <FormControl>
                <Input
                  placeholder="What do you want to ask?"
                  {...field}
                  data-testid="input-question"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="answer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Answer</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a detailed answer..."
                  rows={6}
                  {...field}
                  data-testid="input-answer"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="purchasing">Purchasing</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                    <SelectItem value="commissions">Commissions</SelectItem>
                    <SelectItem value="care">Care Instructions</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-order"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-submit">
            {isPending ? "Saving..." : faq ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
