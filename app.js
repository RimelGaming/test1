/**
 * ThreadCraft V2 — cPanel Phusion Passenger Entry Point (app.js)
 *
 * In cPanel -> Setup Node.js App:
 * - Application mode: Production
 * - Application root: /home/<cpanel_user>/threadcraft-v2
 * - Application startup file: app.js
 *
 * This wrapper ensures NODE_ENV defaults to "production" and registers TypeScript
 * module resolution via tsx (with native Node v22+ fallback) before booting server.ts.
 */

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

async function boot() {
  try {
    const { register } = await import('tsx/esm/api');
    register();
  } catch {
    // Node.js v22+ natively strips types for .ts imports if tsx is unavailable
  }
  await import('./server.ts');
}

boot().catch((err) => {
  console.error('[ThreadCraft V2] Fatal startup error in app.js:', err);
  process.exit(1);
});
