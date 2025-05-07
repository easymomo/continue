/**
 * Transaction Manager
 *
 * Provides transaction support for atomic operations in the task system.
 * Ensures consistency and recovery from failures.
 */

import { v4 as uuidv4 } from "uuid";
import { Transaction } from "../types";
import { StorageManager } from "./storage";

/**
 * Transaction manager for atomic operations
 */
export class TransactionManager {
  private activeTransactions: Map<string, Transaction> = new Map();

  constructor(private storageManager: StorageManager) {}

  /**
   * Begin a new transaction
   */
  public async beginTransaction(): Promise<Transaction> {
    const transaction: Transaction = {
      id: uuidv4(),
      startTime: Date.now(),
      status: "active",
    };

    this.activeTransactions.set(transaction.id, transaction);

    // Log transaction start
    await this.storageManager.logTransactionEvent({
      transactionId: transaction.id,
      type: "begin",
      timestamp: transaction.startTime,
    });

    return transaction;
  }

  /**
   * Commit a transaction
   */
  public async commitTransaction(transaction: Transaction): Promise<void> {
    const activeTransaction = this.activeTransactions.get(transaction.id);

    if (!activeTransaction) {
      throw new Error(`Transaction ${transaction.id} not found`);
    }

    if (activeTransaction.status !== "active") {
      throw new Error(
        `Cannot commit transaction ${transaction.id} with status ${activeTransaction.status}`,
      );
    }

    // Update transaction status
    activeTransaction.status = "committed";

    // Log transaction commit
    await this.storageManager.logTransactionEvent({
      transactionId: transaction.id,
      type: "commit",
      timestamp: Date.now(),
    });

    // Remove from active transactions
    this.activeTransactions.delete(transaction.id);

    // Commit changes to storage
    await this.storageManager.commitTransaction(transaction.id);
  }

  /**
   * Rollback a transaction
   */
  public async rollbackTransaction(transaction: Transaction): Promise<void> {
    const activeTransaction = this.activeTransactions.get(transaction.id);

    if (!activeTransaction) {
      throw new Error(`Transaction ${transaction.id} not found`);
    }

    if (activeTransaction.status !== "active") {
      throw new Error(
        `Cannot rollback transaction ${transaction.id} with status ${activeTransaction.status}`,
      );
    }

    // Update transaction status
    activeTransaction.status = "rolled_back";

    // Log transaction rollback
    await this.storageManager.logTransactionEvent({
      transactionId: transaction.id,
      type: "rollback",
      timestamp: Date.now(),
    });

    // Remove from active transactions
    this.activeTransactions.delete(transaction.id);

    // Rollback changes in storage
    await this.storageManager.rollbackTransaction(transaction.id);
  }

  /**
   * Execute a function within a transaction
   */
  public async executeInTransaction<T>(
    fn: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    const transaction = await this.beginTransaction();

    try {
      const result = await fn(transaction);
      await this.commitTransaction(transaction);
      return result;
    } catch (error) {
      // Rollback transaction on error
      await this.rollbackTransaction(transaction);
      throw error;
    }
  }

  /**
   * Get active transactions
   */
  public getActiveTransactions(): Transaction[] {
    return Array.from(this.activeTransactions.values());
  }

  /**
   * Check if there are any active transactions
   */
  public hasActiveTransactions(): boolean {
    return this.activeTransactions.size > 0;
  }

  /**
   * Get a transaction by ID
   */
  public getTransaction(transactionId: string): Transaction | undefined {
    return this.activeTransactions.get(transactionId);
  }
}
