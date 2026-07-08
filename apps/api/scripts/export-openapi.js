import 'dotenv/config';
import { swaggerSpec } from '../config/swagger.js';
import fs from 'fs';

const outputPath = process.argv[2] || './openapi.json';

try {
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
  console.log(`✅ OpenAPI spec successfully exported to ${outputPath}`);
} catch (error) {
  console.error('❌ Failed to export OpenAPI spec:', error);
  process.exit(1);
}
