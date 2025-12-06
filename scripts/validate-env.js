/**
 * Environment Validation Script
 * 
 * This script validates that all required environment variables are set
 * and have valid values before starting the application.
 * 
 * Usage: node scripts/validate-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Define required environment variables
const requiredVars = {
  // Core
  PORT: { type: 'number', default: 4000, description: 'Backend server port' },
  NODE_ENV: { type: 'enum', values: ['development', 'production', 'test'], default: 'development' },
  
  // MongoDB
  MONGODB_URI: { type: 'string', default: 'mongodb://localhost:27017/collaborative_editor', description: 'MongoDB connection string' },
  
  // Redis (optional but recommended)
  REDIS_URL: { type: 'string', optional: true, description: 'Redis connection URL' },
  
  // JWT
  JWT_SECRET: { type: 'string', minLength: 32, description: 'JWT secret key (min 32 chars)' },
  JWT_EXPIRES_IN: { type: 'string', default: '7d', description: 'JWT expiration time' },
  
  // WebSocket
  VITE_WEBSOCKET_URL: { type: 'url', default: 'http://localhost:4000', description: 'WebSocket server URL' },
  VITE_YJS_URL: { type: 'url', default: 'ws://localhost:1234', description: 'Yjs server URL' },
  
  // CORS
  CORS_ORIGIN: { type: 'string', default: 'http://localhost:5173', description: 'Allowed CORS origin' },
};

const optionalVars = {
  // API Keys
  VITE_GEMINI_API_KEY: { type: 'string', description: 'Gemini AI API key' },
  ASSEMBLYAI_API_KEY: { type: 'string', description: 'AssemblyAI transcription key' },
  
  // Docker
  DOCKER_HOST: { type: 'string', description: 'Docker daemon host' },
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: { type: 'number', default: 900000, description: 'Rate limit window in ms' },
  RATE_LIMIT_MAX: { type: 'number', default: 100, description: 'Max requests per window' },
  
  // Logging
  LOG_LEVEL: { type: 'enum', values: ['error', 'warn', 'info', 'debug'], default: 'info' },
};

function validateEnv() {
  console.log('🔍 Validating environment configuration...\n');
  
  const errors = [];
  const warnings = [];
  const info = [];
  
  // Load .env file if exists
  const envPath = path.join(rootDir, '.env');
  const envExamplePath = path.join(rootDir, '.env.example');
  
  if (fs.existsSync(envPath)) {
    console.log('📄 Found .env file\n');
  } else if (fs.existsSync(envExamplePath)) {
    warnings.push('.env file not found. Copy .env.example to .env and configure values.');
  } else {
    errors.push('Neither .env nor .env.example found!');
  }
  
  // Validate required variables
  console.log('📋 Required Variables:');
  for (const [key, config] of Object.entries(requiredVars)) {
    const value = process.env[key];
    
    if (!value) {
      if (config.default !== undefined) {
        info.push(`  ${key}: Using default "${config.default}"`);
        console.log(`  ⚠️  ${key}: Not set, using default "${config.default}"`);
      } else if (!config.optional) {
        errors.push(`  ${key}: Required but not set`);
        console.log(`  ❌ ${key}: Required but not set`);
      }
      continue;
    }
    
    // Type validation
    let valid = true;
    switch (config.type) {
      case 'number':
        valid = !isNaN(parseInt(value, 10));
        break;
      case 'url':
        try {
          new URL(value);
        } catch {
          valid = false;
        }
        break;
      case 'enum':
        valid = config.values.includes(value);
        break;
      case 'string':
        if (config.minLength && value.length < config.minLength) {
          valid = false;
          errors.push(`  ${key}: Must be at least ${config.minLength} characters`);
        }
        break;
    }
    
    if (valid) {
      console.log(`  ✅ ${key}: Set`);
    } else {
      console.log(`  ❌ ${key}: Invalid value`);
      errors.push(`  ${key}: Invalid value "${value}"`);
    }
  }
  
  // Check optional variables
  console.log('\n📋 Optional Variables:');
  for (const [key, config] of Object.entries(optionalVars)) {
    const value = process.env[key];
    
    if (value) {
      console.log(`  ✅ ${key}: Set`);
    } else {
      console.log(`  ⏭️  ${key}: Not set (optional)`);
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(err => console.log(`   ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(warn => console.log(`   ${warn}`));
  }
  
  if (errors.length === 0) {
    console.log('\n✅ Environment validation passed!\n');
    process.exit(0);
  } else {
    console.log('\n❌ Environment validation failed!\n');
    process.exit(1);
  }
}

validateEnv();
