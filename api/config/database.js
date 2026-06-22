// =============================================================================
// DATABASE CONFIGURATION
// Handles Sequelize initialization with proper SSL for Supabase managed Postgres.
// =============================================================================
import { Sequelize } from 'sequelize';
import config from './env.js';

/**
 * SSL Configuration for Supabase/Render managed PostgreSQL.
 * - Accepts a custom CA cert via DATABASE_CA_CERT env var.
 * - Can force strict SSL via DATABASE_SSL_REJECT_UNAUTHORIZED=true.
 * - Defaults to accepting self-signed certs (common for managed DBs).
 */
const sslConfig = (() => {
  const base = { require: true };

  if (process.env.DATABASE_CA_CERT) {
    return { ...base, rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT };
  }

  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true') {
    return { ...base, rejectUnauthorized: true };
  }

  // Default: accept self-signed certificates (Supabase managed DBs)
  return { ...base, rejectUnauthorized: false };
})();

const sequelize = new Sequelize(config.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: sslConfig,
  },
});

export default sequelize;