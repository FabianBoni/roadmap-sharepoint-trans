import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/* eslint-disable no-console */

const algorithm = 'aes-256-gcm';
const MASTER_KEY_ENV = 'SECRETS_MASTER_KEY';

/**
 * Load and decrypt secrets from .env.vault.json
 * This should be called early in the application lifecycle
 */
export function loadEncryptedSecrets(vaultPath?: string): boolean {
  // Skip if master key not provided
  const masterKey = process.env[MASTER_KEY_ENV];
  if (!masterKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '[Secrets] SECRETS_MASTER_KEY not set, skipping encrypted secrets (using .env.local)'
      );
    }
    return false;
  }

  try {
    // Resolve vault file path
    const resolvedPath = vaultPath || path.join(process.cwd(), '.env.vault.json');

    if (!fs.existsSync(resolvedPath)) {
      console.warn('[Secrets] Configured vault file not found');
      return false;
    }

    // Read and parse encrypted data
    const encryptedData = JSON.parse(fs.readFileSync(resolvedPath, 'utf8')) as {
      iv: string;
      authTag: string;
      encrypted: string;
    };

    const keyBytes = Uint8Array.from(Buffer.from(masterKey, 'hex'));
    const ivBytes = Uint8Array.from(Buffer.from(encryptedData.iv, 'hex'));
    const authTagBytes = Uint8Array.from(Buffer.from(encryptedData.authTag, 'hex'));

    // Decrypt
    const decipher = crypto.createDecipheriv(algorithm, keyBytes, ivBytes);

    decipher.setAuthTag(authTagBytes);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Parse and set environment variables
    let loadedCount = 0;
    decrypted.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();

        // Only set if not already defined (allow override)
        if (!process.env[key]) {
          process.env[key] = value;
          loadedCount++;
        }
      }
    });

    console.log(`[Secrets] ✅ Loaded ${loadedCount} secret(s) from encrypted vault`);
    return true;
  } catch {
    console.error('[Secrets] ❌ Failed to load encrypted secrets');
    if (process.env.NODE_ENV === 'production') {
      // In production, fail hard if decryption fails
      throw new Error('Failed to decrypt production secrets. Check SECRETS_MASTER_KEY.');
    }
    return false;
  }
}

/**
 * Check if secrets are properly configured
 * Useful for startup health checks
 */
export function validateSecretsConfiguration(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required SharePoint credentials
  if (!process.env.SP_KERBEROS_SERVICE_USER && !process.env.SP_USERNAME) {
    errors.push('SharePoint service username is not set');
  }
  if (!process.env.SP_KERBEROS_SERVICE_PASSWORD && !process.env.SP_PASSWORD) {
    errors.push('SharePoint service password is not set');
  }

  // Check for JWT secret
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is not set');
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  if (!process.env.INTERNAL_API_SECRET) {
    errors.push('INTERNAL_API_SECRET is not set');
  } else if (process.env.INTERNAL_API_SECRET.length < 32) {
    errors.push('INTERNAL_API_SECRET must be at least 32 characters long');
  }

  // Check for placeholder values (from .env.example)
  if (process.env.SP_USERNAME === 'your-username' || process.env.SP_USERNAME === '') {
    errors.push('SP_USERNAME contains placeholder value');
  }
  if (
    process.env.JWT_SECRET === 'your-secure-random-string-here-minimum-32-characters' ||
    process.env.JWT_SECRET === ''
  ) {
    errors.push('JWT_SECRET contains placeholder value');
  }

  // Check SharePoint site URLs
  if (!process.env.NEXT_PUBLIC_SHAREPOINT_SITE_URL_DEV) {
    warnings.push('NEXT_PUBLIC_SHAREPOINT_SITE_URL_DEV is not set, using default');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Mask sensitive environment variables for logging
 */
export function maskSensitiveEnv(envVar: string | undefined): string {
  if (!envVar) return '(not set)';
  return '<set>';
}

/**
 * Log environment configuration (safely, without exposing secrets)
 */
export function logEnvironmentStatus(): void {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('Environment Configuration Status');
  console.log('═══════════════════════════════════════════════════════════');

  const validation = validateSecretsConfiguration();

  console.log('\n📋 Configuration:');
  console.log(`   Environment: ${process.env.NEXT_PUBLIC_DEPLOYMENT_ENV || 'development'}`);
  console.log(`   Node Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Auth Strategy: ${process.env.SP_STRATEGY || 'kerberos'}`);
  console.log(
    `   SharePoint User: ${maskSensitiveEnv(process.env.SP_KERBEROS_SERVICE_USER || process.env.SP_USERNAME)}`
  );
  console.log(`   JWT Secret: ${maskSensitiveEnv(process.env.JWT_SECRET)}`);
  console.log(
    `   Master Key: ${process.env.SECRETS_MASTER_KEY ? '✓ Set' : '✗ Not Set (using .env.local)'}`
  );

  if (validation.errors.length > 0) {
    console.log('\n❌ Errors:');
    validation.errors.forEach((err) => console.log(`   - ${err}`));
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach((warn) => console.log(`   - ${warn}`));
  }

  if (validation.valid && validation.warnings.length === 0) {
    console.log('\n✅ Configuration is valid');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

// Auto-load secrets when this module is imported (if master key is set)
if (typeof process !== 'undefined' && process.env && process.env.SECRETS_MASTER_KEY) {
  loadEncryptedSecrets();
}
