#!/usr/bin/env node

/**
 * TypeScript 确保脚本
 * 检查 TypeScript 是否可用，如果不可用则尝试安装
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(message) {
  console.log(`[ensure-typescript] ${message}`);
}

function ensureTypeScript() {
  const tscPath = path.join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');
  
  log('Checking TypeScript installation...');
  log(`Looking for TypeScript at: ${tscPath}`);
  
  // 检查本地 TypeScript 是否存在
  if (fs.existsSync(tscPath)) {
    log('✅ Local TypeScript found');
    try {
      const packagePath = path.join(process.cwd(), 'node_modules', 'typescript', 'package.json');
      const version = require(packagePath).version;
      log(`TypeScript version: ${version}`);
      return true;
    } catch (error) {
      log('❌ TypeScript package.json not readable:' + error.message);
    }
  } else {
    log('❌ Local TypeScript not found');
  }
  
  // 尝试安装 TypeScript
  try {
    log('Installing TypeScript...');
    execSync('npm install typescript@^5.4.5', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    
    if (fs.existsSync(tscPath)) {
      log('✅ TypeScript installed successfully');
      return true;
    }
  } catch (error) {
    log('❌ Failed to install TypeScript');
    log(error.message);
  }
  
  return false;
}

if (require.main === module) {
  const success = ensureTypeScript();
  process.exit(success ? 0 : 1);
}

module.exports = ensureTypeScript;