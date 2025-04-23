#!/usr/bin/env node

/**
 * This script checks for outdated dependencies and generates a report.
 * It scans multiple package.json files across the project.
 * Run with: node src/scripts/update-deps.js
 */

import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

// Function to execute shell commands and return output
const execPromise = (command, cwd = process.cwd()) => {
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

// Function to find all package.json files in the project
async function findPackageJsonFiles(
  dir,
  excludeDirs = ["node_modules", ".git"],
) {
  const results = [];

  async function scan(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name === "package.json") {
        results.push(fullPath);
      }
    }
  }

  await scan(dir);
  return results;
}

// Check for outdated dependencies in a specific directory
async function checkOutdatedDepsInDir(directory) {
  console.log(`\nChecking for outdated dependencies in ${directory}...`);

  const dirName = path.basename(directory);

  try {
    // Get outdated dependencies
    const outdatedOutput = await execPromise("npm outdated --json", directory);

    // If there are no outdated dependencies
    if (!outdatedOutput) {
      console.log(`✅ All dependencies in ${dirName} are up to date!`);
      return { dirName, outdatedDeps: {} };
    }

    const outdatedDeps = JSON.parse(outdatedOutput);
    console.log(
      `Found ${Object.keys(outdatedDeps).length} outdated packages in ${dirName}`,
    );

    return { dirName, directory, outdatedDeps };
  } catch (error) {
    console.error(`Error checking dependencies in ${dirName}:`, error);
    return { dirName, directory, outdatedDeps: {}, error: error.message };
  }
}

// Check for security vulnerabilities in a specific directory
async function checkSecurityInDir(directory) {
  const dirName = path.basename(directory);
  console.log(`\nChecking for security vulnerabilities in ${dirName}...`);

  try {
    const auditOutput = await execPromise("npm audit --json", directory);
    const auditData = JSON.parse(auditOutput);

    if (
      auditData.vulnerabilities &&
      Object.keys(auditData.vulnerabilities).length > 0
    ) {
      // Count vulnerabilities by severity
      const counts = {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        info: 0,
      };

      for (const [name, info] of Object.entries(auditData.vulnerabilities)) {
        counts[info.severity] = (counts[info.severity] || 0) + 1;
      }

      return {
        dirName,
        directory,
        counts,
        vulnerabilities: auditData.vulnerabilities,
      };
    } else {
      console.log(`✅ No security vulnerabilities found in ${dirName}!`);
      return { dirName, directory, counts: {}, vulnerabilities: {} };
    }
  } catch (error) {
    console.error(`Error checking security in ${dirName}:`, error);
    return {
      dirName,
      directory,
      counts: {},
      vulnerabilities: {},
      error: error.message,
    };
  }
}

// Generate a comprehensive report
async function generateReport(outdatedResults, securityResults) {
  const reportDate = new Date().toISOString().split("T")[0];

  // Generate a report
  let report = `# Dependency Update Report - ${reportDate}\n\n`;

  // Add outdated dependencies section
  report += "## Outdated Dependencies\n\n";

  let hasOutdatedDeps = false;

  for (const result of outdatedResults) {
    const { dirName, outdatedDeps, error } = result;

    if (error) {
      report += `### ${dirName}\n\n`;
      report += `Error checking dependencies: ${error}\n\n`;
      continue;
    }

    if (Object.keys(outdatedDeps).length > 0) {
      hasOutdatedDeps = true;
      report += `### ${dirName}\n\n`;
      report += "| Package | Current | Latest | Type |\n";
      report += "|---------|---------|--------|------|\n";

      for (const [name, info] of Object.entries(outdatedDeps)) {
        report += `| ${name} | ${info.current} | ${info.latest} | ${info.type} |\n`;
      }

      report += "\n**Update Commands**\n\n";
      report += "```bash\n";
      report += `# Navigate to directory\ncd ${result.directory}\n\n`;
      report += "# Update all dependencies\nnpm update\n\n";
      report += "# Update specific dependencies\n";

      for (const name of Object.keys(outdatedDeps)) {
        report += `npm install ${name}@latest\n`;
      }

      report += "```\n\n";
    }
  }

  if (!hasOutdatedDeps) {
    report += "No outdated dependencies found across all packages.\n\n";
  }

  // Add security vulnerabilities section
  report += "## Security Vulnerabilities\n\n";

  let hasVulnerabilities = false;

  for (const result of securityResults) {
    const { dirName, counts, vulnerabilities, error } = result;

    if (error) {
      report += `### ${dirName}\n\n`;
      report += `Error checking security: ${error}\n\n`;
      continue;
    }

    if (Object.keys(counts).some((severity) => counts[severity] > 0)) {
      hasVulnerabilities = true;
      report += `### ${dirName}\n\n`;

      for (const [severity, count] of Object.entries(counts)) {
        if (count > 0) {
          report += `- **${severity}**: ${count}\n`;
        }
      }

      report += "\n**Fix Commands**\n\n";
      report += "```bash\n";
      report += `# Navigate to directory\ncd ${result.directory}\n\n`;
      report += "# Show detailed audit report\nnpm audit\n\n";
      report += "# Try to fix vulnerabilities automatically\nnpm audit fix\n";
      report += "```\n\n";
    }
  }

  if (!hasVulnerabilities) {
    report += "No security vulnerabilities found across all packages.\n\n";
  }

  // Save the report
  const reportsDir = path.join(rootDir, "src", "reports");
  try {
    await fs.mkdir(reportsDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }

  const reportPath = path.join(
    reportsDir,
    `dependency-update-${reportDate}.md`,
  );
  await fs.writeFile(reportPath, report);

  console.log(`\n📝 Report generated: ${reportPath}`);
}

// Main function
async function main() {
  console.log("📦 Multi-Package Dependency Update Checker");
  console.log("========================================\n");

  console.log(`Scanning for package.json files in ${rootDir}...`);
  const packageJsonFiles = await findPackageJsonFiles(rootDir);
  console.log(`Found ${packageJsonFiles.length} package.json files\n`);

  const packageDirs = packageJsonFiles.map((file) => path.dirname(file));

  // Check outdated dependencies in all directories
  const outdatedResults = [];
  for (const dir of packageDirs) {
    const result = await checkOutdatedDepsInDir(dir);
    outdatedResults.push(result);
  }

  // Check security in all directories
  const securityResults = [];
  for (const dir of packageDirs) {
    const result = await checkSecurityInDir(dir);
    securityResults.push(result);
  }

  // Generate report
  await generateReport(outdatedResults, securityResults);

  console.log("\n✨ Done!");
}

main().catch(console.error);
