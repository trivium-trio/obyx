// =============================================================================
// CENTRALIZED ENVIRONMENT CONFIGURATION
// Single source of truth for all env vars. Validates required keys at startup
// so the server fails fast with a clear error instead of silently misbehaving.
// =============================================================================

/**
 * Read a required env var — throws immediately if missing.
 */
const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

/**
 * Read an optional env var — returns fallback if missing.
 */
const optional = (key, fallback) => process.env[key] || fallback;

const config = Object.freeze({
  // --- Server ---
  PORT:         optional('PORT', 5000),
  NODE_ENV:     optional('NODE_ENV', 'development'),
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:3000'),

  // --- Supabase ---
  SUPABASE_URL:              required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),

  // --- Database ---
  DATABASE_URL: required('DATABASE_URL'),

  // --- Paystack ---
  PAYSTACK_SECRET_KEY: required('PAYSTACK_SECRET_KEY'),
  PAYSTACK_PUBLIC_KEY: optional('PAYSTACK_PUBLIC_KEY', ''),
});

export default config;
