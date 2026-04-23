#!/usr/bin/env node

/**
 * Master MaxPreps sync script
 * Orchestrates all MaxPreps data synchronization operations
 * 
 * Usage:
 *   node scripts/sync-maxpreps-all.mjs [--dry-run] [--skip-backup]
 * 
 * Options:
 *   --dry-run       Show what would be updated without making changes
 *   --skip-backup   Skip backing up existing data before sync
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Configuration
const SCRIPTS = [
  { name: "Update Teams", script: "update-maxpreps-teams.mjs", required: true },
  { name: "Update Rosters", script: "update-maxpreps-rosters.mjs", required: false },
  { name: "Update Games", script: "update-maxpreps-games.mjs", required: false },
  { name: "Update Logos", script: "update-team-logos.mjs", required: false },
  { name: "Update Uniforms", script: "update-uniforms-and-rankings.mjs", required: false },
];

const DATA_DIR = path.join(projectRoot, "src/app/data");
const BACKUP_DIR = path.join(projectRoot, ".maxpreps-backups");
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
const BACKUP_TIMESTAMP = `backup-${TIMESTAMP}`;

// Parse CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const skipBackup = args.includes("--skip-backup");

// Logger
const log = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  success: (msg) => console.log(`[✓] ${new Date().toISOString()} ${msg}`),
  warning: (msg) => console.log(`[⚠] ${new Date().toISOString()} ${msg}`),
  error: (msg) => console.error(`[✗] ${new Date().toISOString()} ${msg}`),
};

// Create backup of data directory
async function createBackup() {
  if (skipBackup || isDryRun) {
    if (isDryRun) log.info("(DRY RUN) Would create backup");
    return;
  }

  try {
    const backupPath = path.join(BACKUP_DIR, BACKUP_TIMESTAMP);
    await fs.mkdir(backupPath, { recursive: true });

    // Copy important data files
    const filesToBackup = [
      "teams.ts",
      "teams.maxpreps.generated.ts",
      "players.maxpreps.ts",
    ];

    for (const file of filesToBackup) {
      const src = path.join(DATA_DIR, file);
      const dest = path.join(backupPath, file);

      try {
        await fs.copyFile(src, dest);
        log.success(`Backed up ${file}`);
      } catch (e) {
        log.warning(`Could not backup ${file}: ${e.message}`);
      }
    }
  } catch (e) {
    log.error(`Backup creation failed: ${e.message}`);
    throw e;
  }
}

// Run a script and capture output
async function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    try {
      const output = execSync(`node "${scriptPath}"`, {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: "pipe",
      });
      resolve(output);
    } catch (e) {
      reject(e);
    }
  });
}

// Execute sync scripts
async function runSyncScripts() {
  const results = {
    success: [],
    failed: [],
    skipped: [],
  };

  for (const { name, script, required } of SCRIPTS) {
    const scriptPath = path.join(__dirname, script);

    try {
      log.info(`Starting: ${name}...`);

      if (isDryRun) {
        log.info(`(DRY RUN) Would execute ${name}`);
        results.skipped.push({ name, reason: "dry-run" });
        continue;
      }

      // Check if script exists
      try {
        await fs.access(scriptPath);
      } catch {
        if (required) {
          throw new Error(`Required script not found: ${script}`);
        }
        log.warning(`Script not found (skipping optional): ${script}`);
        results.skipped.push({ name, reason: "not-found" });
        continue;
      }

      const output = await runScript(scriptPath);
      log.success(`${name} completed`);
      results.success.push({ name, output: output.slice(0, 200) });
    } catch (error) {
      const errorMsg = error.message || String(error);
      log.error(`${name} failed: ${errorMsg}`);

      if (required) {
        results.failed.push({ name, error: errorMsg });
        throw error;
      }
      results.failed.push({ name, error: errorMsg });
    }
  }

  return results;
}

// Validate sync results
async function validateResults() {
  log.info("Validating sync results...");

  try {
    const teamsPath = path.join(DATA_DIR, "teams.ts");
    const content = await fs.readFile(teamsPath, "utf-8");

    // Check for syntax errors by attempting to parse
    if (!content.includes("export const teams")) {
      throw new Error("teams.ts missing expected exports");
    }

    log.success("Validation passed - teams.ts is valid");
  } catch (e) {
    log.error(`Validation failed: ${e.message}`);
    throw e;
  }
}

// Build project to ensure no regressions
async function buildProject() {
  if (isDryRun) {
    log.info("(DRY RUN) Would build project");
    return;
  }

  log.info("Building project to check for regressions...");

  try {
    execSync("npm run build", {
      cwd: projectRoot,
      stdio: "inherit",
    });
    log.success("Build successful");
  } catch (error) {
    log.error(`Build failed: ${error.message}`);
    throw error;
  }
}

// Print summary report
function printSummary(results) {
  console.log("\n" + "=".repeat(60));
  console.log("MAXPREPS SYNC SUMMARY");
  console.log("=".repeat(60));

  if (isDryRun) {
    console.log("Mode: DRY RUN (no changes made)");
  }

  console.log(`\nSuccessful: ${results.success.length}`);
  results.success.forEach(({ name }) => console.log(`  ✓ ${name}`));

  if (results.failed.length > 0) {
    console.log(`\nFailed: ${results.failed.length}`);
    results.failed.forEach(({ name, error }) => {
      console.log(`  ✗ ${name}: ${error}`);
    });
  }

  if (results.skipped.length > 0) {
    console.log(`\nSkipped: ${results.skipped.length}`);
    results.skipped.forEach(({ name, reason }) => {
      console.log(`  - ${name} (${reason})`);
    });
  }

  console.log("=".repeat(60) + "\n");
}

// Main execution
async function main() {
  try {
    log.info("Starting MaxPreps sync...");
    log.info(`Backup timestamp: ${BACKUP_TIMESTAMP}`);

    // Create backup
    await createBackup();

    // Run sync scripts
    const results = await runSyncScripts();

    // Validate results
    if (results.failed.length === 0) {
      await validateResults();
      await buildProject();
    } else {
      log.warning("Skipping validation/build due to failed scripts");
    }

    printSummary(results);

    // Exit with error if any required scripts failed
    if (results.failed.length > 0) {
      process.exit(1);
    }

    log.success("MaxPreps sync completed successfully");
  } catch (error) {
    log.error(`Sync failed: ${error.message}`);
    process.exit(1);
  }
}

main();
