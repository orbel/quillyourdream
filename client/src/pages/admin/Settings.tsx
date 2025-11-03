import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import type { SiteSettings } from "@shared/schema";

export default function AdminSettings() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  const [hue, setHue] = useState(15);
  const [saturation, setSaturation] = useState(75);
  const [lightness, setLightness] = useState(55);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (settings) {
      setHue(settings.accentHue);
      setSaturation(settings.accentSaturation);
      setLightness(settings.accentLightness);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: { accentHue: number; accentSaturation: number; accentLightness: number }) => {
      return await apiRequest("PATCH", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your accent color has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return await apiRequest("PATCH", "/api/auth/password", data);
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      accentHue: hue,
      accentSaturation: saturation,
      accentLightness: lightness,
    });
  };

  const handleReset = () => {
    const defaultSettings = {
      accentHue: 15,
      accentSaturation: 75,
      accentLightness: 55,
    };
    setHue(defaultSettings.accentHue);
    setSaturation(defaultSettings.accentSaturation);
    setLightness(defaultSettings.accentLightness);
    updateMutation.mutate(defaultSettings);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  const previewColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const hasChanges = settings && (
    hue !== settings.accentHue ||
    saturation !== settings.accentSaturation ||
    lightness !== settings.accentLightness
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-playfair font-bold">Site Settings</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-playfair font-bold" data-testid="heading-settings">
          Site Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Customize your website's appearance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accent Color</CardTitle>
          <CardDescription>
            Choose the primary accent color for your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-6">
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hue-slider">
                    Hue: {hue}°
                  </Label>
                  <Slider
                    id="hue-slider"
                    min={0}
                    max={360}
                    step={1}
                    value={[hue]}
                    onValueChange={([value]) => setHue(value)}
                    data-testid="slider-hue"
                  />
                  <p className="text-xs text-muted-foreground">
                    0° = Red, 120° = Green, 240° = Blue
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saturation-slider">
                    Saturation: {saturation}%
                  </Label>
                  <Slider
                    id="saturation-slider"
                    min={0}
                    max={100}
                    step={1}
                    value={[saturation]}
                    onValueChange={([value]) => setSaturation(value)}
                    data-testid="slider-saturation"
                  />
                  <p className="text-xs text-muted-foreground">
                    0% = Gray, 100% = Vivid
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lightness-slider">
                    Lightness: {lightness}%
                  </Label>
                  <Slider
                    id="lightness-slider"
                    min={0}
                    max={100}
                    step={1}
                    value={[lightness]}
                    onValueChange={([value]) => setLightness(value)}
                    data-testid="slider-lightness"
                  />
                  <p className="text-xs text-muted-foreground">
                    0% = Black, 50% = Pure color, 100% = White
                  </p>
                </div>
              </div>

              <div className="w-48">
                <Label>Preview</Label>
                <div className="mt-2 space-y-3">
                  <div
                    className="w-full h-32 rounded-md border"
                    style={{ backgroundColor: previewColor }}
                    data-testid="preview-color"
                  />
                  <div className="text-center">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {previewColor}
                    </code>
                  </div>
                  <Button
                    className="w-full"
                    style={{ backgroundColor: previewColor, color: 'white' }}
                  >
                    Sample Button
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
                data-testid="button-save-settings"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={updateMutation.isPending}
                data-testid="button-reset-settings"
              >
                Reset to Default
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Suggestions</CardTitle>
          <CardDescription>
            Popular color palettes for art portfolios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "Terracotta", hue: 15, sat: 75, light: 55 },
              { name: "Sage Green", hue: 140, sat: 35, light: 45 },
              { name: "Navy Blue", hue: 220, sat: 70, light: 35 },
              { name: "Burgundy", hue: 350, sat: 65, light: 40 },
              { name: "Teal", hue: 180, sat: 60, light: 45 },
              { name: "Plum", hue: 280, sat: 50, light: 50 },
              { name: "Forest", hue: 130, sat: 55, light: 35 },
              { name: "Coral", hue: 10, sat: 75, light: 60 },
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setHue(preset.hue);
                  setSaturation(preset.sat);
                  setLightness(preset.light);
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-md border hover-elevate active-elevate-2"
                data-testid={`preset-${preset.name.toLowerCase().replace(' ', '-')}`}
              >
                <div
                  className="w-full h-12 rounded"
                  style={{ backgroundColor: `hsl(${preset.hue}, ${preset.sat}%, ${preset.light}%)` }}
                />
                <span className="text-sm font-medium">{preset.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                data-testid="input-new-password"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                data-testid="input-confirm-password"
              />
            </div>
            <Button
              type="submit"
              disabled={passwordMutation.isPending}
              data-testid="button-change-password"
            >
              {passwordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
