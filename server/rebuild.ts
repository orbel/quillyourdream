import { exec } from "child_process";
import { promisify } from "util";
import { rename, rm, access } from "fs/promises";
import { join } from "path";
import path from "path";

const execAsync = promisify(exec);

let isRebuilding = false;
let lastRebuildTime = 0;
const REBUILD_COOLDOWN = 10000; // 10 seconds minimum between rebuilds

export async function triggerRebuild(): Promise<{ success: boolean; message: string }> {
  // Prevent concurrent rebuilds
  if (isRebuilding) {
    return {
      success: false,
      message: "A rebuild is already in progress. Please wait.",
    };
  }

  // Prevent rapid rebuilds
  const now = Date.now();
  if (now - lastRebuildTime < REBUILD_COOLDOWN) {
    return {
      success: false,
      message: `Please wait ${Math.ceil((REBUILD_COOLDOWN - (now - lastRebuildTime)) / 1000)}s before rebuilding again.`,
    };
  }

  // Only rebuild in production mode
  if (process.env.NODE_ENV !== "production") {
    return {
      success: false,
      message: "Rebuilds only run in production mode. In development, changes are reflected automatically via HMR.",
    };
  }

  isRebuilding = true;
  lastRebuildTime = now;

  try {
    console.log("🔄 Starting static site rebuild...");
    
    const rootDir = process.cwd();
    const distDir = join(rootDir, "dist");
    const publicDir = join(distDir, "public");
    const tempPublicDir = join(distDir, "public.new");
    const oldPublicDir = join(distDir, "public.old");

    // Step 1: Build client to temporary directory
    console.log("📦 Building client assets...");
    await execAsync("vite build", { cwd: rootDir });

    // Step 2: Pre-render pages to the new build
    console.log("🎨 Pre-rendering pages...");
    await execAsync("tsx scripts/prerender-ssr.tsx", { cwd: rootDir });

    // Step 3: Atomic swap - zero downtime
    console.log("🔄 Swapping to new build...");
    
    // Verify new build exists before proceeding
    try {
      await access(tempPublicDir);
    } catch (e) {
      throw new Error("New build directory not found. Build may have failed.");
    }

    // Clean up old backup if it exists
    try {
      await access(oldPublicDir);
      await rm(oldPublicDir, { recursive: true, force: true });
    } catch (e) {
      // Old backup doesn't exist, that's fine
    }

    // Perform atomic swap with rollback on failure
    let swapSuccessful = false;
    try {
      // Step 1: Rename current public to old (if it exists)
      const publicExists = await access(publicDir).then(() => true).catch(() => false);
      if (publicExists) {
        await rename(publicDir, oldPublicDir);
      }

      // Step 2: Rename new build to public (atomic operation)
      await rename(tempPublicDir, publicDir);
      swapSuccessful = true;

      // Clean up old backup after successful swap
      if (publicExists) {
        setTimeout(async () => {
          try {
            await rm(oldPublicDir, { recursive: true, force: true });
            console.log("🧹 Cleaned up old build");
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 5000);
      }
    } catch (swapError: any) {
      // Rollback: restore old public directory if swap failed
      if (!swapSuccessful) {
        try {
          const oldExists = await access(oldPublicDir).then(() => true).catch(() => false);
          if (oldExists) {
            await rename(oldPublicDir, publicDir);
            console.log("⚠️ Swap failed, rolled back to previous version");
          }
        } catch (rollbackError) {
          console.error("❌ CRITICAL: Failed to rollback after swap failure:", rollbackError);
          throw new Error("Swap and rollback both failed. Manual intervention may be required.");
        }
      }
      throw new Error(`Swap failed: ${swapError.message}`);
    }

    console.log("✅ Static site rebuild complete!");

    return {
      success: true,
      message: "Static site rebuilt successfully. New version is now live!",
    };
  } catch (error: any) {
    console.error("❌ Rebuild failed:", error);
    return {
      success: false,
      message: `Rebuild failed: ${error.message}`,
    };
  } finally {
    isRebuilding = false;
  }
}

export function getRebuildStatus() {
  return {
    isRebuilding,
    lastRebuildTime: lastRebuildTime > 0 ? new Date(lastRebuildTime).toISOString() : null,
    canRebuild: !isRebuilding && Date.now() - lastRebuildTime >= REBUILD_COOLDOWN,
  };
}
