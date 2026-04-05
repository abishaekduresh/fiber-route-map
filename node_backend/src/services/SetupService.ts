import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
// @ts-expect-error: Knex types for NodeNext
import { knex, type Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { generateUuidV7 } from '../utils/uuid.js';
import { nowDb } from '../utils/time.js';
import logger from '../utils/logger.js';

// Resolve node_backend/ root regardless of process.cwd() or compilation mode.
// Works for both tsx (src/services/) and tsc compiled (dist/services/) execution.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, '../..');
const ENV_PATH = path.join(BACKEND_ROOT, '.env');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DbConfig {
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPass: string;
  dbCharset?: string;
}

export interface EnvConfig extends DbConfig {
  timezone: string;
  port: number;
  apiVersion: string;
  nodeEnv?: string;
}

export interface AdminData {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}

export interface SetupStatus {
  isComplete: boolean;
  steps: {
    envConfigured: boolean;
    dbConnected: boolean;
    tablesMigrated: boolean;
    permissionsSeeded: boolean;
    adminCreated: boolean;
  };
}

export interface StepResult {
  step: string;
  success: boolean;
  message: string;
}

export interface SetupResult {
  success: boolean;
  steps: StepResult[];
}

// ─── Permission Definitions ───────────────────────────────────────────────────

const ROUTE_PERMISSIONS = [
  { resource: 'user',       actions: ['view', 'create', 'update', 'delete', 'export'] },
  { resource: 'role',       actions: ['view', 'create', 'update', 'delete'] },
  { resource: 'country',    actions: ['view', 'create', 'update', 'delete'] },
  { resource: 'permission',       actions: ['view', 'create', 'update', 'delete'] },
  { resource: 'tenant',           actions: ['view', 'create', 'update', 'delete'] },
  { resource: 'tenant_business',  actions: ['view', 'create', 'update', 'delete'] },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function createKnexInstance(config: DbConfig): Knex {
  return knex({
    client: 'mysql2',
    connection: {
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      password: config.dbPass,
      database: config.dbName,
      charset: config.dbCharset || 'utf8mb4',
    },
    pool: { min: 0, max: 5 },
  });
}

// ─── SetupService ─────────────────────────────────────────────────────────────

export class SetupService {

  // ── Status ──────────────────────────────────────────────────────────────────

  async getStatus(): Promise<SetupStatus> {
    const envConfigured = fs.existsSync(ENV_PATH) && !!process.env.DB_HOST;

    let dbConnected = false;
    let tablesMigrated = false;
    let permissionsSeeded = false;
    let adminCreated = false;

    if (envConfigured) {
      let db: Knex | null = null;
      try {
        db = createKnexInstance({
          dbHost: process.env.DB_HOST!,
          dbPort: Number(process.env.DB_PORT) || 3306,
          dbName: process.env.DB_NAME!,
          dbUser: process.env.DB_USER!,
          dbPass: process.env.DB_PASS || '',
          dbCharset: process.env.DB_CHARSET || 'utf8mb4',
        });
        await db.raw('SELECT 1');
        dbConnected = true;

        const hasUsers = await db.schema.hasTable('users');
        const hasPermissions = await db.schema.hasTable('permissions');
        tablesMigrated = hasUsers && hasPermissions;

        if (tablesMigrated) {
          const permCount = await db('permissions').count('* as cnt').first();
          permissionsSeeded = Number(permCount?.cnt || 0) > 0;

          const userCount = await db('users').count('* as cnt').first();
          adminCreated = Number(userCount?.cnt || 0) > 0;
        }
      } catch {
        // DB not reachable yet — that's fine
      } finally {
        if (db) await db.destroy();
      }
    }

    return {
      isComplete: process.env.SETUP_COMPLETE === 'true',
      steps: { envConfigured, dbConnected, tablesMigrated, permissionsSeeded, adminCreated },
    };
  }

  // ── Reset Setup (drop database, clear SETUP_COMPLETE) ───────────────────────

  async resetSetup(): Promise<{ success: boolean; message: string }> {
    const dbHost = process.env.DB_HOST;
    const dbPort = Number(process.env.DB_PORT) || 3306;
    const dbName = process.env.DB_NAME;
    const dbUser = process.env.DB_USER;
    const dbPass = process.env.DB_PASS || '';
    const dbCharset = process.env.DB_CHARSET || 'utf8mb4';

    if (!dbHost || !dbName || !dbUser) {
      return { success: false, message: 'No database configuration found in environment — nothing to reset' };
    }

    // Connect without specifying DB to avoid "unknown database" error
    const db = knex({
      client: 'mysql2',
      connection: { host: dbHost, port: dbPort, user: dbUser, password: dbPass, charset: dbCharset },
      pool: { min: 0, max: 2 },
    });

    try {
      await db.raw(`DROP DATABASE IF EXISTS \`${dbName}\``);
      logger.info(`Setup reset: dropped database '${dbName}'`);
    } finally {
      await db.destroy();
    }

    // Clear SETUP_COMPLETE from .env and in-memory
    if (fs.existsSync(ENV_PATH)) {
      const updated = fs.readFileSync(ENV_PATH, 'utf-8')
        .split('\n')
        .map((line) => line.startsWith('SETUP_COMPLETE=') ? 'SETUP_COMPLETE=false' : line)
        .join('\n');
      fs.writeFileSync(ENV_PATH, updated, 'utf-8');
    }
    process.env.SETUP_COMPLETE = 'false';

    return { success: true, message: `Database '${dbName}' dropped and setup reset` };
  }

  // ── Test Connection ──────────────────────────────────────────────────────────

  async testConnection(config: DbConfig): Promise<{ success: boolean; message: string }> {
    // Connect without specifying the database to check credentials first
    const db = knex({
      client: 'mysql2',
      connection: {
        host: config.dbHost,
        port: config.dbPort,
        user: config.dbUser,
        password: config.dbPass,
        charset: config.dbCharset || 'utf8mb4',
      },
      pool: { min: 0, max: 2 },
    });

    try {
      await db.raw('SELECT 1');
      return { success: true, message: `Connected to MySQL at ${config.dbHost}:${config.dbPort}` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection failed' };
    } finally {
      await db.destroy();
    }
  }

  // ── Write .env ───────────────────────────────────────────────────────────────

  writeEnv(envConfig: EnvConfig): void {
    // Parse existing .env preserving comments
    const existing: string[] = [];
    const existingKeys = new Set<string>();
    if (fs.existsSync(ENV_PATH)) {
      const lines = fs.readFileSync(ENV_PATH, 'utf-8').split('\n');
      for (const line of lines) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=/);
        if (match) existingKeys.add(match[1]);
        existing.push(line);
      }
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const newValues: Record<string, string> = {
      PORT: String(envConfig.port),
      NODE_ENV: envConfig.nodeEnv || 'development',
      DEBUG: 'true',
      TIMEZONE: envConfig.timezone,
      API_VERSION: envConfig.apiVersion,
      DB_HOST: envConfig.dbHost,
      DB_PORT: String(envConfig.dbPort),
      DB_NAME: envConfig.dbName,
      DB_USER: envConfig.dbUser,
      DB_PASS: envConfig.dbPass,
      DB_CHARSET: envConfig.dbCharset || 'utf8mb4',
      MGMT_TOKEN_SECRET: secret,
      SETUP_COMPLETE: 'true',
    };

    // Build the new .env content
    const lines: string[] = [];

    // Add section headers + values
    lines.push('# Application Settings');
    lines.push(`PORT=${newValues.PORT}`);
    lines.push(`NODE_ENV=${newValues.NODE_ENV}`);
    lines.push(`DEBUG=${newValues.DEBUG}`);
    lines.push(`TIMEZONE=${newValues.TIMEZONE}`);
    lines.push('');
    lines.push('# API Version');
    lines.push(`API_VERSION=${newValues.API_VERSION}`);
    lines.push('');
    lines.push('# Database Settings');
    lines.push(`DB_HOST=${newValues.DB_HOST}`);
    lines.push(`DB_PORT=${newValues.DB_PORT}`);
    lines.push(`DB_NAME=${newValues.DB_NAME}`);
    lines.push(`DB_USER=${newValues.DB_USER}`);
    lines.push(`DB_PASS=${newValues.DB_PASS}`);
    lines.push(`DB_CHARSET=${newValues.DB_CHARSET}`);
    lines.push('');
    lines.push('# Auth Settings');
    lines.push(`MGMT_TOKEN_SECRET=${newValues.MGMT_TOKEN_SECRET}`);
    lines.push('');
    lines.push('# Setup');
    lines.push(`SETUP_COMPLETE=${newValues.SETUP_COMPLETE}`);

    fs.writeFileSync(ENV_PATH, lines.join('\n'), 'utf-8');

    // Update process.env in-memory so the running server reflects new values
    for (const [key, value] of Object.entries(newValues)) {
      process.env[key] = value;
    }

    logger.info('Setup: .env file written successfully');
  }

  // ── Migrate (create all tables) ──────────────────────────────────────────────

  async migrate(db: Knex): Promise<void> {
    // 1. users
    await db.schema.createTableIfNotExists('users', (t: Knex.CreateTableBuilder) => {
      t.increments('id').primary();
      t.string('uuid', 36).notNullable().unique();
      t.string('email', 191).notNullable().unique();   // 191 = max safe length for utf8mb4 unique index (191*4=764 < 767)
      t.string('username', 100).notNullable().unique();
      t.string('name', 255).notNullable();
      t.string('phone', 20).notNullable().unique();
      t.string('password', 191).notNullable();         // bcrypt output is 60 chars; 191 is ample
      t.enum('status', ['active', 'blocked', 'deleted']).notNullable().defaultTo('active');
      t.integer('countryId').unsigned().nullable();
      t.integer('sessionLimit').unsigned().notNullable().defaultTo(1);
      t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(db.fn.now());
      t.timestamp('deletedAt').nullable();
    });

    // 2. countries
    await db.schema.createTableIfNotExists('countries', (t: Knex.CreateTableBuilder) => {
      t.increments('id').primary();
      t.string('uuid', 36).notNullable().unique();
      t.string('name', 255).notNullable();
      t.string('code', 10).notNullable().unique();
      t.string('phoneCode', 10).notNullable();
      t.enum('status', ['active', 'blocked', 'deleted']).notNullable().defaultTo('active');
      t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(db.fn.now());
      t.timestamp('deletedAt').nullable();
    });

    // Add FK for users.countryId → countries.id (deferred — both tables exist now)
    const hasCountryFk = await db.schema.hasColumn('users', 'countryId');
    if (hasCountryFk) {
      try {
        await db.schema.alterTable('users', (t: Knex.CreateTableBuilder) => {
          t.foreign('countryId').references('id').inTable('countries').onDelete('SET NULL');
        });
      } catch {
        // FK may already exist — ignore
      }
    }

    // 3. roles
    await db.schema.createTableIfNotExists('roles', (t: Knex.CreateTableBuilder) => {
      t.increments('id').primary();
      t.string('uuid', 36).notNullable().unique();
      t.string('name', 255).notNullable();
      t.string('slug', 191).notNullable().unique();   // 191 = safe utf8mb4 index length
      t.text('description').nullable();
      t.enum('status', ['active', 'inactive']).notNullable().defaultTo('active');
      t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(db.fn.now());
      t.timestamp('deletedAt').nullable();
    });

    // 4. user_roles
    await db.schema.createTableIfNotExists('user_roles', (t: Knex.CreateTableBuilder) => {
      t.integer('userId').unsigned().notNullable();
      t.integer('roleId').unsigned().notNullable();
      t.primary(['userId', 'roleId']);
      t.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
      t.foreign('roleId').references('id').inTable('roles').onDelete('CASCADE');
    });

    // 5. permissions
    await db.schema.createTableIfNotExists('permissions', (t: Knex.CreateTableBuilder) => {
      t.increments('id').primary();
      t.string('uuid', 36).notNullable().unique();
      t.string('name', 255).notNullable();
      t.string('slug', 191).notNullable().unique();   // 191 = safe utf8mb4 index length
      t.string('resource', 100).notNullable();
      t.text('description').nullable();
      t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(db.fn.now());
    });

    // 6. role_permissions
    await db.schema.createTableIfNotExists('role_permissions', (t: Knex.CreateTableBuilder) => {
      t.integer('roleId').unsigned().notNullable();
      t.integer('permissionId').unsigned().notNullable();
      t.primary(['roleId', 'permissionId']);
      t.foreign('roleId').references('id').inTable('roles').onDelete('CASCADE');
      t.foreign('permissionId').references('id').inTable('permissions').onDelete('CASCADE');
    });

    // 7. user_sessions (matches AuthRepository.sessionsTable)
    await db.schema.createTableIfNotExists('user_sessions', (t: Knex.CreateTableBuilder) => {
      t.increments('id').primary();
      t.string('uuid', 36).notNullable().unique();
      t.integer('userId').unsigned().notNullable();
      t.string('sessionToken', 191).notNullable().unique(); // 191 = safe utf8mb4 index length
      t.string('deviceId', 255).nullable();
      t.string('deviceName', 255).nullable();
      t.string('ipAddress', 45).nullable();
      t.string('userAgent', 255).nullable();
      t.timestamp('expiresAt').notNullable();
      t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(db.fn.now());
      t.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
    });

    // 8. user_identities (matches AuthRepository.identitiesTable)
    await db.schema.createTableIfNotExists('user_identities', (t: Knex.CreateTableBuilder) => {
      t.increments('id').primary();
      t.integer('userId').unsigned().notNullable();
      t.enum('provider', ['local', 'google', 'github']).notNullable().defaultTo('local');
      t.string('providerUserId', 191).notNullable();
      t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
      t.unique(['provider', 'providerUserId']);
      t.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
    });

    // 10. tenants
    await db.schema.createTableIfNotExists('tenants', (t: Knex.CreateTableBuilder) => {
      t.increments('id').primary();
      t.string('uuid', 36).notNullable().unique();
      t.string('email', 191).notNullable().unique();
      t.string('username', 100).notNullable().unique();
      t.string('name', 100).notNullable();
      t.string('address', 255).notNullable();
      t.text('password').notNullable();
      t.integer('countryId').unsigned().nullable();
      t.integer('roleId').unsigned().nullable();
      t.enum('status', ['active', 'blocked', 'suspended', 'deleted']).notNullable().defaultTo('active');
      t.datetime('createdAt').notNullable().defaultTo(db.fn.now());
      t.datetime('updatedAt').notNullable().defaultTo(db.fn.now());
      t.datetime('deletedAt').nullable();
      t.index(['status'], 'idx_tenants_status');
      t.index(['name'], 'idx_tenants_name');
    });

    try {
      await db.schema.alterTable('tenants', (t: Knex.CreateTableBuilder) => {
        t.foreign('countryId').references('id').inTable('countries').onDelete('SET NULL');
        t.foreign('roleId').references('id').inTable('roles').onDelete('SET NULL');
      });
    } catch { /* FKs may already exist */ }

    // 11. tenant_business
    await db.schema.createTableIfNotExists('tenant_business', (t: Knex.CreateTableBuilder) => {
      t.increments('id').primary();
      t.string('uuid', 36).notNullable().unique();
      t.string('name', 100).notNullable();
      t.string('address', 255).notNullable();
      t.string('email', 191).notNullable().unique();
      t.string('phone', 30).notNullable();
      t.integer('countryId').unsigned().nullable();
      t.enum('type', ['operator', 'distributor']).notNullable();
      t.enum('status', ['active', 'blocked', 'suspended', 'deleted']).notNullable().defaultTo('active');
      t.datetime('createdAt').notNullable().defaultTo(db.fn.now());
      t.datetime('updatedAt').notNullable().defaultTo(db.fn.now());
      t.datetime('deletedAt').nullable();
      t.index(['status'], 'idx_tenant_business_status');
      t.index(['type'], 'idx_tenant_business_type');
      t.index(['name'], 'idx_tenant_business_name');
    });

    try {
      await db.schema.alterTable('tenant_business', (t: Knex.CreateTableBuilder) => {
        t.foreign('countryId').references('id').inTable('countries').onDelete('SET NULL');
      });
    } catch { /* FK may already exist */ }

    logger.info('Setup: All tables created/verified');
  }

  // ── Seed Default Countries ───────────────────────────────────────────────────

  async seedDefaultCountries(db: Knex): Promise<void> {
    const now = nowDb();

    const defaults = [
      { name: 'India', code: 'IN', phoneCode: '+91' },
    ];

    for (const country of defaults) {
      const uuid = generateUuidV7();
      await db.raw(
        'INSERT IGNORE INTO countries (uuid, name, code, phoneCode, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuid, country.name, country.code, country.phoneCode, 'active', now, now]
      );
    }

    logger.info(`Setup: Seeded ${defaults.length} default country/countries`);
  }

  // ── Seed Permissions ─────────────────────────────────────────────────────────

  async seedPermissions(db: Knex): Promise<number[]> {
    const now = nowDb();
    const permissionIds: number[] = [];

    for (const { resource, actions } of ROUTE_PERMISSIONS) {
      for (const action of actions) {
        const slug = `${resource}.${action}`;
        const name = `${capitalize(action)} ${capitalize(resource)}s`;
        const description = `Can ${action} ${resource}s`;
        const uuid = generateUuidV7();

        await db.raw(
          'INSERT IGNORE INTO permissions (uuid, name, slug, resource, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuid, name, slug, resource, description, now, now]
        );

        const row = await db('permissions').where('slug', slug).select('id').first();
        if (row) permissionIds.push(row.id);
      }
    }

    logger.info(`Setup: Seeded/verified ${permissionIds.length} permissions`);
    return permissionIds;
  }

  // ── Seed Super Admin Role ────────────────────────────────────────────────────

  async seedSuperAdminRole(db: Knex, permissionIds: number[]): Promise<number> {
    const now = nowDb();
    const uuid = generateUuidV7();

    await db.raw(
      'INSERT IGNORE INTO roles (uuid, name, slug, description, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuid, 'Super Admin', 'super-admin', 'Full system access — all permissions enabled', 'active', now, now]
    );

    const role = await db('roles').where('slug', 'super-admin').select('id').first();
    if (!role) throw new Error('Failed to create Super Admin role');

    const roleId = role.id;

    for (const permId of permissionIds) {
      await db.raw(
        'INSERT IGNORE INTO role_permissions (roleId, permissionId) VALUES (?, ?)',
        [roleId, permId]
      );
    }

    logger.info(`Setup: Super Admin role created/verified (id=${roleId}) with ${permissionIds.length} permissions`);
    return roleId;
  }

  // ── Create Admin User ────────────────────────────────────────────────────────

  async createAdminUser(db: Knex, adminData: AdminData, roleId: number): Promise<void> {
    const now = nowDb();

    // Idempotency: skip if email already exists
    const existing = await db('users').where('email', adminData.email).first();
    if (existing) {
      logger.info('Setup: Admin user already exists, skipping creation');
      return;
    }

    // Also check username/phone uniqueness
    const byUsername = await db('users').where('username', adminData.username).first();
    if (byUsername) {
      const err = new Error(`Username '${adminData.username}' is already taken`);
      (err as any).status = 409;
      throw err;
    }

    const byPhone = await db('users').where('phone', adminData.phone).first();
    if (byPhone) {
      const err = new Error('Phone number is already registered');
      (err as any).status = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const userUuid = generateUuidV7();

    await db('users').insert({
      uuid: userUuid,
      email: adminData.email,
      username: adminData.username,
      name: adminData.name,
      phone: adminData.phone,
      password: hashedPassword,
      status: 'active',
      countryId: null,
      sessionLimit: 5,
      createdAt: now,
      updatedAt: now,
    });

    const newUser = await db('users').where('uuid', userUuid).select('id').first();
    if (!newUser) throw new Error('Failed to retrieve created admin user');

    await db.raw(
      'INSERT IGNORE INTO user_roles (userId, roleId) VALUES (?, ?)',
      [newUser.id, roleId]
    );

    logger.info(`Setup: Admin user created (uuid=${userUuid}) and assigned Super Admin role`);
  }

  // ── Full Setup Run ───────────────────────────────────────────────────────────

  async runFullSetup(payload: { env: EnvConfig; admin: AdminData }): Promise<SetupResult> {
    const steps: StepResult[] = [];
    let db: Knex | null = null;

    try {
      // Step 1: Write .env
      try {
        this.writeEnv(payload.env);
        steps.push({ step: 'env', success: true, message: '.env file written successfully' });
      } catch (err: any) {
        steps.push({ step: 'env', success: false, message: err.message });
        return { success: false, steps };
      }

      // Step 2: Create database (connect without DB name, then CREATE DATABASE IF NOT EXISTS)
      try {
        const rootDb = knex({
          client: 'mysql2',
          connection: {
            host: payload.env.dbHost,
            port: payload.env.dbPort,
            user: payload.env.dbUser,
            password: payload.env.dbPass,
            charset: payload.env.dbCharset || 'utf8mb4',
          },
          pool: { min: 0, max: 2 },
        });
        await rootDb.raw(`CREATE DATABASE IF NOT EXISTS \`${payload.env.dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await rootDb.destroy();
        steps.push({ step: 'database', success: true, message: `Database '${payload.env.dbName}' created/verified` });
      } catch (err: any) {
        steps.push({ step: 'database', success: false, message: err.message });
        return { success: false, steps };
      }

      // Create DB-specific knex instance for remaining steps
      db = createKnexInstance(payload.env);

      // Step 3: Migrate tables
      try {
        await this.migrate(db);
        steps.push({ step: 'tables', success: true, message: '11 tables created/verified successfully' });
      } catch (err: any) {
        steps.push({ step: 'tables', success: false, message: err.message });
        return { success: false, steps };
      }

      // Step 4: Seed default countries
      try {
        await this.seedDefaultCountries(db);
        steps.push({ step: 'countries', success: true, message: 'Default country India seeded/verified' });
      } catch (err: any) {
        steps.push({ step: 'countries', success: false, message: err.message });
        return { success: false, steps };
      }

      // Step 5: Seed permissions
      let permissionIds: number[] = [];
      try {
        permissionIds = await this.seedPermissions(db);
        steps.push({ step: 'permissions', success: true, message: `${permissionIds.length} permissions seeded/verified` });
      } catch (err: any) {
        steps.push({ step: 'permissions', success: false, message: err.message });
        return { success: false, steps };
      }

      // Step 6: Create Super Admin role
      let roleId: number;
      try {
        roleId = await this.seedSuperAdminRole(db, permissionIds);
        steps.push({ step: 'role', success: true, message: 'Super Admin role created/verified with all permissions' });
      } catch (err: any) {
        steps.push({ step: 'role', success: false, message: err.message });
        return { success: false, steps };
      }

      // Step 7: Create admin user
      try {
        await this.createAdminUser(db, payload.admin, roleId);
        steps.push({ step: 'admin', success: true, message: `Admin user '${payload.admin.username}' created and assigned Super Admin role` });
      } catch (err: any) {
        steps.push({ step: 'admin', success: false, message: err.message });
        return { success: false, steps };
      }

      return { success: true, steps };

    } finally {
      if (db) await db.destroy();
    }
  }
}
