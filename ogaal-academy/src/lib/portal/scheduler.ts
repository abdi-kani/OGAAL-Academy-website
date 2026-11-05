import "server-only";
import { spawn } from "node:child_process";
import path from "node:path";
import { purgeExpiredAuthRows } from "./auth";
import { sweepExpired } from "./certificates";
import { getSettings } from "./settings";

const HOUR = 3600000;

/** Hourly server work that runs with nobody logged in: expire certificates, tidy sessions, take the daily backup. */
async function tick(): Promise<void> {
  await sweepExpired().catch((err) => console.error("Expiry sweep failed:", err.message));
  await purgeExpiredAuthRows().catch((err) => console.error("Session cleanup failed:", err.message));
  if (process.env.BACKUP_ENABLED === "true") {
    const { backup_last_attempt_at: last } = await getSettings();
    if (!last || Date.now() - new Date(last).getTime() >= 23 * HOUR) {
      spawn(process.execPath, [path.join(process.cwd(), "scripts", "backup.cjs")], { stdio: "inherit", cwd: process.cwd() }).on("error", (err) => console.error("Backup could not start:", err.message));
    }
  }
}

export function startScheduler(): void {
  const store = globalThis as unknown as { __ogaalScheduler?: NodeJS.Timeout };
  if (store.__ogaalScheduler) return;
  tick().catch((err) => console.error("Scheduled work failed:", err.message));
  store.__ogaalScheduler = setInterval(() => void tick().catch((err) => console.error("Scheduled work failed:", err.message)), HOUR);
  store.__ogaalScheduler.unref?.();
}
