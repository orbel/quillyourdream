import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface RebuildStatus {
  isRebuilding: boolean;
  lastRebuildTime: string | null;
  canRebuild: boolean;
}

export function RebuildButton() {
  const { toast } = useToast();
  
  const { data: status, isLoading } = useQuery<RebuildStatus>({
    queryKey: ["/api/admin/rebuild/status"],
    refetchInterval: (query) => query.state.data?.isRebuilding ? 2000 : 10000, // Poll faster when rebuilding
  });

  const rebuildMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/rebuild", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Rebuild failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/rebuild/status"] });
      } else {
        toast({
          variant: "destructive",
          title: "Rebuild Failed",
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Rebuild Failed",
        description: error.message || "An error occurred during rebuild",
      });
    },
  });

  const handleRebuild = () => {
    rebuildMutation.mutate();
  };

  const isBuilding = rebuildMutation.isPending || status?.isRebuilding;
  const canRebuild = status?.canRebuild && !isBuilding;

  return (
    <Card data-testid="card-rebuild">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Static Site Rebuild
        </CardTitle>
        <CardDescription>
          Rebuild the static site when content changes to update the production version
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status?.lastRebuildTime && (
          <div className="text-sm text-muted-foreground" data-testid="text-last-rebuild">
            Last rebuild: {new Date(status.lastRebuildTime).toLocaleString()}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRebuild}
            disabled={!canRebuild || isLoading}
            data-testid="button-rebuild"
          >
            {isBuilding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Rebuilding...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Rebuild Site
              </>
            )}
          </Button>
          
          {isBuilding && (
            <span className="text-sm text-muted-foreground flex items-center gap-1" data-testid="text-rebuilding">
              <Loader2 className="h-3 w-3 animate-spin" />
              This may take 30-60 seconds...
            </span>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <strong>Zero downtime</strong> - Old version continues serving while new version builds
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <strong>Automatic in production</strong> - Changes take effect after rebuild completes
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div>
              <strong>Development mode</strong> - Changes reflect immediately via HMR (no rebuild needed)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
