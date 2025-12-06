/**
 * Complete Setup Script
 * 
 * This script runs all setup tasks in sequence:
 * 1. Install npm dependencies
 * 2. Validate environment
 * 3. Initialize database
 * 4. Build Docker images (optional)
 * 
 * Usage: node scripts/setup.js [--skip-docker] [--skip-db]
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const skipDocker = args.includes('--skip-docker');
const skipDb = args.includes('--skip-db');

function exec(command, options = {}) {
  console.log(`\n💻 Running: ${command}\n`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: rootDir,
      ...options 
    });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    return false;
  }
}

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n');
  
  const checks = [
    { cmd: 'node --version', name: 'Node.js', minVersion: '18.0.0' },
    { cmd: 'npm --version', name: 'npm', minVersion: '9.0.0' },
  ];
  
  if (!skipDocker) {
    checks.push({ cmd: 'docker --version', name: 'Docker' });
    checks.push({ cmd: 'docker-compose --version', name: 'Docker Compose' });
  }
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const output = execSync(check.cmd, { encoding: 'utf8' }).trim();
      console.log(`  ✅ ${check.name}: ${output.split('\n')[0]}`);
    } catch {
      console.log(`  ❌ ${check.name}: Not found`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

function createEnvFile() {
  const envPath = path.join(rootDir, '.env');
  const envExamplePath = path.join(rootDir, '.env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log('\n📝 Creating .env file from .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('  ✅ .env file created');
    console.log('  ⚠️  Please review and update .env with your configuration\n');
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       Collaborative Code Editor - Complete Setup           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Step 1: Check prerequisites
  console.log('━━━ Step 1/5: Checking Prerequisites ━━━');
  if (!checkPrerequisites()) {
    console.error('\n❌ Please install missing prerequisites and try again.');
    process.exit(1);
  }
  
  // Step 2: Create .env file if needed
  console.log('\n━━━ Step 2/5: Environment Setup ━━━');
  createEnvFile();
  
  // Step 3: Install npm dependencies
  console.log('\n━━━ Step 3/5: Installing Dependencies ━━━');
  if (!exec('npm install')) {
    console.error('\n❌ Failed to install dependencies.');
    process.exit(1);
  }
  console.log('  ✅ Dependencies installed successfully');
  
  // Step 4: Initialize database (optional)
  if (!skipDb) {
    console.log('\n━━━ Step 4/5: Database Initialization ━━━');
    console.log('  ⏭️  Skipping database initialization (run manually with: npm run setup:db)');
    // Uncomment below to auto-init database
    // if (!exec('node scripts/init-db.js')) {
    //   console.warn('\n⚠️  Database initialization failed. You can run it manually later.');
    // }
  } else {
    console.log('\n━━━ Step 4/5: Database Initialization ━━━');
    console.log('  ⏭️  Skipped (--skip-db flag)');
  }
  
  // Step 5: Build Docker images (optional)
  if (!skipDocker) {
    console.log('\n━━━ Step 5/5: Docker Setup ━━━');
    console.log('  ℹ️  Building Docker images for code executors...');
    if (!exec('docker-compose -f docker/docker-compose.yml build python-executor node-executor java-executor cpp-executor c-executor go-executor')) {
      console.warn('\n⚠️  Docker build failed. You can run it manually later.');
    } else {
      console.log('  ✅ Docker images built successfully');
    }
  } else {
    console.log('\n━━━ Step 5/5: Docker Setup ━━━');
    console.log('  ⏭️  Skipped (--skip-docker flag)');
  }
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Setup Complete! 🎉                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 Next steps:');
  console.log('   1. Review and update .env file with your configuration');
  console.log('   2. Start MongoDB: mongod (or use Docker)');
  console.log('   3. Start the development server: npm run dev\n');
  
  console.log('🚀 Quick start commands:');
  console.log('   npm run dev:frontend    - Start frontend dev server');
  console.log('   npm run dev:backend     - Start backend server');
  console.log('   npm run dev:yjs         - Start Yjs collaboration server');
  console.log('   npm run dev             - Start all servers concurrently\n');
  
  console.log('🧪 Validation commands:');
  console.log('   npm run validate:types  - Check TypeScript');
  console.log('   npm run validate:lint   - Check code style');
  console.log('   npm run validate:env    - Check environment variables\n');
}

main().catch(console.error);
