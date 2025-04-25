#!/usr/bin/env node

/**
 * Dependency Agent - Bridges dependency checking with documentation management
 * This script:
 * 1. Checks for outdated dependencies using update-deps.ts
 * 2. Identifies libraries that need documentation updates
 * 3. Creates tasks for the Documentation Agent
 * 4. Prepares migration plans for significant updates
 *
 * Run with: npx ts-node src/scripts/dependency-agent.ts
 */

import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

// Load the update-deps.ts functionality
import {
  checkOutdatedDepsInDir,
  checkSecurityInDir,
  findPackageJsonFiles,
  generateReport,
} from "./update-deps.js";

// Types for our script
interface LibraryUpdateInfo {
  name: string;
  currentVersion: string;
  latestVersion: string;
  packageDir: string;
  isMajorUpdate: boolean;
  type: string;
}

interface DocumentationTask {
  type: string;
  library: string;
  currentVersion: string;
  targetVersion: string;
  priority: string;
  description: string;
  directory: string;
}

// Function to execute shell commands and return output
const execPromise = (command: string, cwd = process.cwd()): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
};

// Determine libraries that need documentation updates
async function identifyDocsUpdateNeeded(
  outdatedResults: any[],
): Promise<LibraryUpdateInfo[]> {
  const needsUpdate: LibraryUpdateInfo[] = [];

  for (const result of outdatedResults) {
    const { dirName, outdatedDeps, error } = result;

    if (error) continue;

    for (const [name, info] of Object.entries(outdatedDeps)) {
      // Determine if this is a major version change
      const currentMajor = parseInt((info as any).current.split(".")[0]);
      const latestMajor = parseInt((info as any).latest.split(".")[0]);
      const isMajorUpdate = latestMajor > currentMajor;

      needsUpdate.push({
        name,
        currentVersion: (info as any).current,
        latestVersion: (info as any).latest,
        packageDir: dirName,
        isMajorUpdate,
        type: (info as any).type,
      });
    }
  }

  return needsUpdate;
}

// Create tasks for the Documentation Agent
async function createDocumentationTasks(
  librariesNeedingUpdate: LibraryUpdateInfo[],
): Promise<DocumentationTask[]> {
  const tasks: DocumentationTask[] = [];

  for (const lib of librariesNeedingUpdate) {
    tasks.push({
      type: "documentation_update",
      library: lib.name,
      currentVersion: lib.currentVersion,
      targetVersion: lib.latestVersion,
      priority: lib.isMajorUpdate ? "high" : "medium",
      description: `Update documentation for ${lib.name} from v${lib.currentVersion} to v${lib.latestVersion}`,
      directory: lib.packageDir,
    });
  }

  // Write tasks to a file for the Documentation Agent
  const tasksDir = path.join(
    rootDir,
    "src",
    "agents",
    "documentation",
    "tasks",
  );
  try {
    await fs.mkdir(tasksDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }

  const taskFilePath = path.join(
    tasksDir,
    `doc-update-tasks-${new Date().toISOString().split("T")[0]}.json`,
  );

  await fs.writeFile(taskFilePath, JSON.stringify({ tasks }, null, 2));
  console.log(`📋 Documentation tasks created: ${taskFilePath}`);

  return tasks;
}

// Create migration plan for major updates
async function createMigrationPlan(
  librariesNeedingUpdate: LibraryUpdateInfo[],
): Promise<string | undefined> {
  // Filter to only major updates
  const majorUpdates = librariesNeedingUpdate.filter(
    (lib) => lib.isMajorUpdate,
  );

  if (majorUpdates.length === 0) {
    console.log("No major updates requiring migration plans");
    return;
  }

  let migrationPlan = `# Dependency Migration Plan\n\n`;
  migrationPlan += `Generated on: ${new Date().toISOString().split("T")[0]}\n\n`;
  migrationPlan += `## Major Version Updates\n\n`;

  for (const lib of majorUpdates) {
    migrationPlan += `### ${lib.name}: v${lib.currentVersion} → v${lib.latestVersion}\n\n`;
    migrationPlan += `- **Package Directory**: ${lib.packageDir}\n`;
    migrationPlan += `- **Dependency Type**: ${lib.type}\n\n`;
    migrationPlan += `#### Migration Steps\n\n`;
    migrationPlan += `1. Review the changelog: [${lib.name} Changelog](https://npmjs.com/package/${lib.name})\n`;
    migrationPlan += `2. Update dependency: \`npm install ${lib.name}@${lib.latestVersion} --save${lib.type === "devDependencies" ? "-dev" : ""}\`\n`;
    migrationPlan += `3. Test for breaking changes\n`;
    migrationPlan += `4. Update documentation in vector DB\n\n`;
  }

  // Save the migration plan
  const plansDir = path.join(rootDir, "src", "reports", "migration-plans");
  try {
    await fs.mkdir(plansDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }

  const planPath = path.join(
    plansDir,
    `migration-plan-${new Date().toISOString().split("T")[0]}.md`,
  );

  await fs.writeFile(planPath, migrationPlan);
  console.log(`📝 Migration plan generated: ${planPath}`);

  return planPath;
}

// Main function
async function main(): Promise<void> {
  console.log("🤖 AIgents Dependency Agent");
  console.log("==========================\n");

  // First, run the dependency check
  console.log("Step 1: Scanning for package.json files...");
  const packageJsonFiles = await findPackageJsonFiles(rootDir);
  console.log(`Found ${packageJsonFiles.length} package.json files\n`);

  const packageDirs = packageJsonFiles.map((file) => path.dirname(file));

  console.log("Step 2: Checking for outdated dependencies...");
  const outdatedResults = [];
  for (const dir of packageDirs) {
    const result = await checkOutdatedDepsInDir(dir);
    outdatedResults.push(result);
  }

  console.log("\nStep 3: Checking for security vulnerabilities...");
  const securityResults = [];
  for (const dir of packageDirs) {
    const result = await checkSecurityInDir(dir);
    securityResults.push(result);
  }

  console.log("\nStep 4: Generating dependency report...");
  await generateReport(outdatedResults, securityResults);

  console.log(
    "\nStep 5: Identifying libraries needing documentation updates...",
  );
  const librariesNeedingUpdate =
    await identifyDocsUpdateNeeded(outdatedResults);
  console.log(
    `Found ${librariesNeedingUpdate.length} libraries that need documentation updates`,
  );

  console.log("\nStep 6: Creating documentation tasks...");
  await createDocumentationTasks(librariesNeedingUpdate);

  console.log("\nStep 7: Creating migration plan for major updates...");
  await createMigrationPlan(librariesNeedingUpdate);

  console.log("\n✨ Dependency Agent completed all tasks!");
}

// When run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export functions for use in other scripts
export {
  createDocumentationTasks,
  createMigrationPlan,
  identifyDocsUpdateNeeded,
};
