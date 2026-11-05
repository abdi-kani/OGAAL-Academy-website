/** Starts the portal's background work when the server boots. The public site runs fine without a database. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DB_HOST || !process.env.DB_NAME) return;
  const { startScheduler } = await import("./lib/portal/scheduler");
  startScheduler();
}
