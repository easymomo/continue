/**
 * Dependency Check Task for AIgents
 *
 * This module provides task creation and management for dependency checking
 * as part of the AIgents multi-agent system.
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../..");

// Import dependency agent functionality
import {
  createDocumentationTasks,
  createMigrationPlan,
  identifyDocsUpdateNeeded,
} from "../../scripts/dependency-agent.js";

// Import the task management system (assuming a task manager exists)
// import { addTask, completeTask, TaskPriority, TaskStatus } from '../task-manager.js';

/**
 * Create a dependency check task
 * @param {string} name - Name of the task
 * @param {string} description - Description of what the task will do
 * @param {string} requestedBy - User or agent that requested this task
 * @returns {Object} The created task object
 */
export async function createDependencyCheckTask(
  name,
  description,
  requestedBy,
) {
  const task = {
    id: `dep-check-${Date.now()}`,
    name: name || "Dependency Check",
    description:
      description ||
      "Check for outdated dependencies and security vulnerabilities",
    type: "dependency_check",
    status: "pending",
    priority: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    requestedBy: requestedBy || "system",
    assignedTo: "dependency_agent",
    steps: [
      { id: "scan", name: "Scan package.json files", status: "pending" },
      {
        id: "check_outdated",
        name: "Check for outdated dependencies",
        status: "pending",
      },
      {
        id: "check_security",
        name: "Check for security vulnerabilities",
        status: "pending",
      },
      {
        id: "generate_report",
        name: "Generate dependency report",
        status: "pending",
      },
      {
        id: "identify_docs",
        name: "Identify libraries needing documentation updates",
        status: "pending",
      },
      {
        id: "create_doc_tasks",
        name: "Create documentation update tasks",
        status: "pending",
      },
      {
        id: "create_migration",
        name: "Create migration plan for major updates",
        status: "pending",
      },
    ],
    context: {},
    result: null,
  };

  // Save task to the task store
  await saveTask(task);

  // Add to task manager if it's available
  // if (typeof addTask === 'function') {
  //   await addTask(task);
  // }

  return task;
}

/**
 * Execute a dependency check task
 * @param {Object} task - The task to execute
 * @returns {Object} The updated task with results
 */
export async function executeDependencyCheckTask(task) {
  if (task.status === "completed") {
    console.log(`Task ${task.id} already completed`);
    return task;
  }

  try {
    // Update task status
    task.status = "in_progress";
    task.updatedAt = new Date().toISOString();
    await updateTaskStatus(task);

    // Import dependency checking functions dynamically to avoid circular dependencies
    const {
      findPackageJsonFiles,
      checkOutdatedDepsInDir,
      checkSecurityInDir,
      generateReport,
    } = await import("../../scripts/update-deps.js");

    // Step 1: Scan for package.json files
    console.log(`Task ${task.id}: Scanning for package.json files...`);
    updateTaskStep(task, "scan", "in_progress");
    const packageJsonFiles = await findPackageJsonFiles(rootDir);
    task.context.packageJsonFiles = packageJsonFiles;
    task.context.packageDirs = packageJsonFiles.map((file) =>
      path.dirname(file),
    );
    updateTaskStep(task, "scan", "completed");

    // Step 2: Check for outdated dependencies
    console.log(`Task ${task.id}: Checking for outdated dependencies...`);
    updateTaskStep(task, "check_outdated", "in_progress");
    const outdatedResults = [];
    for (const dir of task.context.packageDirs) {
      const result = await checkOutdatedDepsInDir(dir);
      outdatedResults.push(result);
    }
    task.context.outdatedResults = outdatedResults;
    updateTaskStep(task, "check_outdated", "completed");

    // Step 3: Check for security vulnerabilities
    console.log(`Task ${task.id}: Checking for security vulnerabilities...`);
    updateTaskStep(task, "check_security", "in_progress");
    const securityResults = [];
    for (const dir of task.context.packageDirs) {
      const result = await checkSecurityInDir(dir);
      securityResults.push(result);
    }
    task.context.securityResults = securityResults;
    updateTaskStep(task, "check_security", "completed");

    // Step 4: Generate report
    console.log(`Task ${task.id}: Generating dependency report...`);
    updateTaskStep(task, "generate_report", "in_progress");
    const reportPath = await generateReport(outdatedResults, securityResults);
    task.context.reportPath = reportPath;
    updateTaskStep(task, "generate_report", "completed");

    // Step 5: Identify libraries needing documentation updates
    console.log(
      `Task ${task.id}: Identifying libraries needing documentation updates...`,
    );
    updateTaskStep(task, "identify_docs", "in_progress");
    const librariesNeedingUpdate =
      await identifyDocsUpdateNeeded(outdatedResults);
    task.context.librariesNeedingUpdate = librariesNeedingUpdate;
    updateTaskStep(task, "identify_docs", "completed");

    // Step 6: Create documentation tasks
    console.log(`Task ${task.id}: Creating documentation tasks...`);
    updateTaskStep(task, "create_doc_tasks", "in_progress");
    if (librariesNeedingUpdate.length > 0) {
      const docTasks = await createDocumentationTasks(librariesNeedingUpdate);
      task.context.docTasks = docTasks;
    }
    updateTaskStep(task, "create_doc_tasks", "completed");

    // Step 7: Create migration plan
    console.log(`Task ${task.id}: Creating migration plan...`);
    updateTaskStep(task, "create_migration", "in_progress");
    if (librariesNeedingUpdate.some((lib) => lib.isMajorUpdate)) {
      const migrationPlanPath = await createMigrationPlan(
        librariesNeedingUpdate,
      );
      task.context.migrationPlanPath = migrationPlanPath;
    }
    updateTaskStep(task, "create_migration", "completed");

    // Complete the task
    task.status = "completed";
    task.updatedAt = new Date().toISOString();
    task.result = {
      packageJsonCount: packageJsonFiles.length,
      outdatedPackages: outdatedResults.reduce(
        (count, result) =>
          count + Object.keys(result.outdatedDeps || {}).length,
        0,
      ),
      securityIssues: securityResults.reduce(
        (count, result) =>
          count +
          Object.entries(result.counts || {}).reduce(
            (sum, [_, value]) => sum + value,
            0,
          ),
        0,
      ),
      reportPath,
      librariesNeedingDocUpdate: librariesNeedingUpdate.length,
      majorUpdatesRequired: librariesNeedingUpdate.filter(
        (lib) => lib.isMajorUpdate,
      ).length,
    };

    await updateTask(task);
    return task;
  } catch (error) {
    console.error(`Error executing dependency check task: ${error.message}`);
    task.status = "failed";
    task.updatedAt = new Date().toISOString();
    task.result = {
      error: error.message,
      stack: error.stack,
    };
    await updateTask(task);
    return task;
  }
}

/**
 * Update the status of a specific step in the task
 * @param {Object} task - The task to update
 * @param {string} stepId - The ID of the step to update
 * @param {string} status - The new status of the step
 */
function updateTaskStep(task, stepId, status) {
  const step = task.steps.find((s) => s.id === stepId);
  if (step) {
    step.status = status;
    if (status === "completed") {
      step.completedAt = new Date().toISOString();
    }
  }
}

/**
 * Save a task to the filesystem
 * @param {Object} task - The task to save
 */
async function saveTask(task) {
  const tasksDir = path.join(rootDir, "src", "agents", "tasks", "store");
  try {
    await fs.mkdir(tasksDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }

  const taskPath = path.join(tasksDir, `${task.id}.json`);
  await fs.writeFile(taskPath, JSON.stringify(task, null, 2));
}

/**
 * Update just the status of a task
 * @param {Object} task - The task to update
 */
async function updateTaskStatus(task) {
  task.updatedAt = new Date().toISOString();
  await saveTask(task);
}

/**
 * Update an entire task
 * @param {Object} task - The task to update
 */
async function updateTask(task) {
  task.updatedAt = new Date().toISOString();
  await saveTask(task);
}

/**
 * Get a task by ID
 * @param {string} taskId - The ID of the task to retrieve
 * @returns {Object} The task object
 */
export async function getTask(taskId) {
  const tasksDir = path.join(rootDir, "src", "agents", "tasks", "store");
  const taskPath = path.join(tasksDir, `${taskId}.json`);

  try {
    const taskData = await fs.readFile(taskPath, "utf8");
    return JSON.parse(taskData);
  } catch (error) {
    return null;
  }
}

/**
 * List all dependency check tasks
 * @returns {Array} Array of task objects
 */
export async function listDependencyCheckTasks() {
  const tasksDir = path.join(rootDir, "src", "agents", "tasks", "store");

  try {
    await fs.mkdir(tasksDir, { recursive: true });
    const files = await fs.readdir(tasksDir);
    const tasks = [];

    for (const file of files) {
      if (file.startsWith("dep-check-") && file.endsWith(".json")) {
        const taskPath = path.join(tasksDir, file);
        const taskData = await fs.readFile(taskPath, "utf8");
        const task = JSON.parse(taskData);
        tasks.push(task);
      }
    }

    return tasks;
  } catch (error) {
    console.error(`Error listing dependency check tasks: ${error.message}`);
    return [];
  }
}
