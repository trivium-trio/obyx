import { Sequelize } from 'sequelize';

const sslConfig = (() => {
  const base = { require: true };

  if (process.env.DATABASE_CA_CERT) {
    return { ...base, rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT };
  }

  // Allow forcing strict SSL verification via environment variables
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true') {
    return { ...base, rejectUnauthorized: true };
  }

  // Default: accept self-signed certificates (Fix for Render/Supabase managed DBs)
  return { ...base, rejectUnauthorized: false };
})();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: sslConfig
  }
});

export default sequelize;