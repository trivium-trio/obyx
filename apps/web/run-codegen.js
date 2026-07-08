import { execSync } from 'child_process';

try {
  console.log("Running openapi-typescript-codegen...");
  execSync('npx --yes openapi-typescript-codegen --input ./openapi.json --output ./lib/api/generated --client fetch', { stdio: 'inherit' });
  console.log("Done.");
} catch (error) {
  console.error(error);
  process.exit(1);
}
