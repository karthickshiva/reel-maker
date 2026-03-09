import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('mobile/src has all required subdirectories', () => {
  const requiredDirs = [
    'app',
    'navigation',
    'screens',
    'components',
    'services',
    'store',
    'hooks',
    'theme',
    'types',
    'utils',
    'constants',
  ];

  for (const dir of requiredDirs) {
    assert.equal(exists(path.join('mobile/src', dir)), true, `Missing directory: mobile/src/${dir}`);
  }
});

test('services has all required service directories and package manifests', () => {
  const requiredServices = ['gateway', 'user-service', 'ai-service', 'subtitle-worker', 'export-service'];

  for (const service of requiredServices) {
    assert.equal(exists(path.join('services', service)), true, `Missing service directory: services/${service}`);
    assert.equal(
      exists(path.join('services', service, 'package.json')),
      true,
      `Missing package.json in services/${service}`,
    );
  }
});

test('.env.example includes all required environment keys', () => {
  const requiredKeys = [
    'NODE_ENV',
    'PORT',
    'LOG_LEVEL',
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'JWT_ACCESS_EXPIRY',
    'JWT_REFRESH_EXPIRY',
    'OPENAI_API_KEY',
    'OPENAI_MODEL',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET_EXPORTS',
    'S3_REGION',
    'API_BASE_URL',
  ];

  const envFile = read('.env.example');
  const keys = new Set(
    envFile
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'))
      .map(line => line.split('=')[0]),
  );

  for (const key of requiredKeys) {
    assert.equal(keys.has(key), true, `Missing env key: ${key}`);
  }
});

test('.gitignore includes required ignore rules', () => {
  const requiredEntries = ['node_modules', '.env', 'android/build', 'ios/build', '*.jks'];
  const gitignore = read('.gitignore');

  for (const entry of requiredEntries) {
    assert.match(gitignore, new RegExp(entry.replace('*', '\\*')), `Missing .gitignore entry: ${entry}`);
  }
});
