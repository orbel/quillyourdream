import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SiteSettings } from "@shared/schema";

export function useAccentColor() {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (settings) {
      const { accentHue, accentSaturation, accentLightness } = settings;
      
      const root = document.documentElement;
      
      // Apply admin's exact HSL values to ALL accent color tokens
      // This ensures complete consistency between what admin selects and what displays
      const hsl = `${accentHue} ${accentSaturation}% ${accentLightness}%`;
      
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--sidebar-primary", hsl);
      root.style.setProperty("--sidebar-ring", hsl);
      root.style.setProperty("--accent", hsl);
      root.style.setProperty("--sidebar-accent", hsl);
    }
  }, [settings]);

  return settings;
}
