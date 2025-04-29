import { 
  users, type User, type InsertUser,
  currencies, type Currency, type InsertCurrency,
  inventory, type Inventory, type InsertInventory,
  inventoryBatches, type InventoryBatch, type InsertInventoryBatch,
  transactions, type Transaction, type InsertTransaction,
  dailyStats, type DailyStats, type InsertDailyStats,
  type CurrencyWithInventory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull, sql } from "drizzle-orm";
import { IStorage } from "./storage";
import { Decimal } from "decimal.js";

// Helper function to convert number to string for DB operations
function toDbNumber(value: number): string {
  return value.toString();
}

// Helper function to convert string from DB to number for calculations
function fromDbNumber(value: string): number {
  return new Decimal(value).toNumber();
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  
  async initialize(): Promise<void> {
    // Initialize with sample currencies if none exist
    const existingCurrencies = await this.getCurrencies();
    
    if (existingCurrencies.length === 0) {
      const sampleCurrencies = [
        { code: "USD", name: "US Dollar", country: "United States", currentRate: toDbNumber(83.45) },
        { code: "EUR", name: "Euro", country: "European Union", currentRate: toDbNumber(90.12) },
        { code: "GBP", name: "British Pound", country: "United Kingdom", currentRate: toDbNumber(105.78) },
        { code: "JPY", name: "Japanese Yen", country: "Japan", currentRate: toDbNumber(0.55) }
      ];
      
      for (const currencyData of sampleCurrencies) {
        const currency = await this.createCurrency(currencyData);
        
        // Create initial inventory with 0 amount
        await this.createInventoryItem({
          currencyId: currency.id,
          amount: toDbNumber(0),
          avgBuyPrice: currencyData.currentRate,
          totalValue: toDbNumber(0)
        });
      }
      
      // Initialize today's stats
      const today = new Date().toISOString().split('T')[0];
      await this.createOrUpdateDailyStats({
        date: today,
        profit: toDbNumber(0),
        transactionCount: 0
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Currency methods
  async getCurrencies(): Promise<Currency[]> {
    return db.select().from(currencies);
  }
  
  async getCurrency(id: number): Promise<Currency | undefined> {
    const [currency] = await db.select().from(currencies).where(eq(currencies.id, id));
    return currency;
  }
  
  async getCurrencyByCode(code: string): Promise<Currency | undefined> {
    const [currency] = await db.select().from(currencies).where(eq(currencies.code, code));
    return currency;
  }
  
  async createCurrency(insertCurrency: InsertCurrency): Promise<Currency> {
    const [currency] = await db.insert(currencies).values({
      ...insertCurrency,
      lastUpdated: new Date()
    }).returning();
    return currency;
  }
  
  async updateCurrencyRate(id: number, rate: number): Promise<Currency | undefined> {
    const [updatedCurrency] = await db
      .update(currencies)
      .set({ 
        currentRate: toDbNumber(rate), 
        lastUpdated: new Date() 
      })
      .where(eq(currencies.id, id))
      .returning();
    return updatedCurrency;
  }
  
  // Inventory methods
  async getInventoryItems(): Promise<Inventory[]> {
    return db.select().from(inventory);
  }
  
  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item;
  }
  
  async getInventoryByCurrencyId(currencyId: number): Promise<Inventory | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.currencyId, currencyId));
    return item;
  }
  
  async createInventoryItem(insertInventory: InsertInventory): Promise<Inventory> {
    const [item] = await db.insert(inventory).values({
      ...insertInventory,
      lastUpdated: new Date()
    }).returning();
    return item;
  }
  
  async updateInventoryItem(id: number, amount: number, avgBuyPrice: number, totalValue?: number): Promise<Inventory | undefined> {
    // If totalValue is not provided, calculate it based on amount and avgBuyPrice
    const actualTotalValue = totalValue ?? Number(amount) * Number(avgBuyPrice);
    
    const [updatedItem] = await db
      .update(inventory)
      .set({ 
        amount: toDbNumber(amount), 
        avgBuyPrice: toDbNumber(avgBuyPrice),
        totalValue: toDbNumber(actualTotalValue),
        lastUpdated: new Date() 
      })
      .where(eq(inventory.id, id))
      .returning();
    return updatedItem;
  }
  
  // Inventory batch methods
  async getInventoryBatches(currencyId: number): Promise<InventoryBatch[]> {
    // Get all batches for a currency with remaining amount > 0, ordered by buy price (ascending)
    return db
      .select()
      .from(inventoryBatches)
      .where(
        and(
          eq(inventoryBatches.currencyId, currencyId),
          sql`${inventoryBatches.remainingAmount} > 0`
        )
      )
      .orderBy(desc(inventoryBatches.buyPrice)); // Higher prices first for selling
  }
  
  async createInventoryBatch(insertBatch: InsertInventoryBatch): Promise<InventoryBatch> {
    const [batch] = await db
      .insert(inventoryBatches)
      .values(insertBatch)
      .returning();
    return batch;
  }
  
  async updateInventoryBatch(id: number, remainingAmount: number): Promise<InventoryBatch> {
    const [updatedBatch] = await db
      .update(inventoryBatches)
      .set({ remainingAmount: toDbNumber(remainingAmount) })
      .where(eq(inventoryBatches.id, id))
      .returning();
    return updatedBatch;
  }
  
  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.timestamp)); // Newest first
  }
  
  async getTransactionsByCurrencyId(currencyId: number): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.currencyId, currencyId))
      .orderBy(desc(transactions.timestamp)); // Newest first
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    // Insert the transaction
    const [transaction] = await db
      .insert(transactions)
      .values({
        ...insertTransaction,
        timestamp: new Date()
      })
      .returning();
    
    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    const [dailyStat] = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.date, today));
    
    if (dailyStat) {
      const profit = transaction.profit || "0";
      const newProfit = new Decimal(dailyStat.profit).plus(profit).toString();
      await db
        .update(dailyStats)
        .set({
          profit: newProfit,
          transactionCount: dailyStat.transactionCount + 1
        })
        .where(eq(dailyStats.date, today));
    } else {
      await db
        .insert(dailyStats)
        .values({
          date: today,
          profit: transaction.profit || toDbNumber(0),
          transactionCount: 1
        });
    }
    
    return transaction;
  }
  
  // Added method to update transaction
  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }
  
  // Added method to delete transaction
  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(eq(transactions.id, id))
      .returning({ id: transactions.id });
    
    return result.length > 0;
  }
  
  // Stats methods
  async getDailyStats(date: string): Promise<DailyStats | undefined> {
    const [stat] = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.date, date));
    return stat;
  }
  
  async createOrUpdateDailyStats(insertStats: InsertDailyStats): Promise<DailyStats> {
    // Check if stats for this date already exist
    const [existingStat] = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.date, insertStats.date));
    
    if (existingStat) {
      // Update existing stats
      const [updatedStat] = await db
        .update(dailyStats)
        .set({
          profit: insertStats.profit,
          transactionCount: insertStats.transactionCount
        })
        .where(eq(dailyStats.date, insertStats.date))
        .returning();
      return updatedStat;
    } else {
      // Create new stats
      const [newStat] = await db
        .insert(dailyStats)
        .values(insertStats)
        .returning();
      return newStat;
    }
  }
  
  // Combined methods
  async getCurrenciesWithInventory(): Promise<CurrencyWithInventory[]> {
    // Get all currencies
    const allCurrencies = await this.getCurrencies();
    const result: CurrencyWithInventory[] = [];
    
    // For each currency, get its inventory
    for (const currency of allCurrencies) {
      const inventoryItem = await this.getInventoryByCurrencyId(currency.id);
      result.push({
        ...currency,
        inventory: inventoryItem
      });
    }
    
    return result;
  }
  
  async resetInventory(): Promise<void> {
    // Get all currencies
    const allCurrencies = await this.getCurrencies();
    
    // For each currency:
    for (const currency of allCurrencies) {
      // 1. Get its inventory
      const inventoryItem = await this.getInventoryByCurrencyId(currency.id);
      
      if (inventoryItem) {
        // 2. Reset inventory amount to 0
        await this.updateInventoryItem(
          inventoryItem.id, 
          0, 
          fromDbNumber(currency.currentRate),
          0 // Total value is 0
        );
      }
      
      // 3. Delete all inventory batches for this currency
      await db
        .delete(inventoryBatches)
        .where(eq(inventoryBatches.currencyId, currency.id));
    }
    
    // Clear all transactions
    await db.delete(transactions);
    
    // Reset today's stats
    const today = new Date().toISOString().split('T')[0];
    await this.createOrUpdateDailyStats({
      date: today,
      profit: toDbNumber(0),
      transactionCount: 0
    });
  }
}