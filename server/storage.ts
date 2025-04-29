import { database } from './database';
import { 
  users, type User, type InsertUser,
  currencies, type Currency, type InsertCurrency,
  inventory, type Inventory, type InsertInventory,
  transactions, type Transaction, type InsertTransaction,
  dailyStats, type DailyStats, type InsertDailyStats,
  type CurrencyWithInventory
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods (keeping existing ones)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Currency methods
  getCurrencies(): Promise<Currency[]>;
  getCurrency(id: number): Promise<Currency | undefined>;
  getCurrencyByCode(code: string): Promise<Currency | undefined>;
  createCurrency(currency: InsertCurrency): Promise<Currency>;
  updateCurrencyRate(id: number, rate: number): Promise<Currency | undefined>;
  
  // Inventory methods
  getInventoryItems(): Promise<Inventory[]>;
  getInventoryItem(id: number): Promise<Inventory | undefined>;
  getInventoryByCurrencyId(currencyId: number): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, amount: number, avgBuyPrice: number): Promise<Inventory | undefined>;
  
  // Transaction methods
  getTransactions(): Promise<Transaction[]>;
  getTransactionsByCurrencyId(currencyId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Stats methods
  getDailyStats(date: string): Promise<DailyStats | undefined>;
  createOrUpdateDailyStats(stats: InsertDailyStats): Promise<DailyStats>;
  
  // Combined methods
  getCurrenciesWithInventory(): Promise<CurrencyWithInventory[]>;
  resetInventory(): Promise<void>;
}

// SQLite storage implementation
export class SqliteStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const stmt = database.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const stmt = database.db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const stmt = database.db.prepare(
      'INSERT INTO users (username, password) VALUES (?, ?)'
    );
    const result = stmt.run(user.username, user.password);
    return { id: result.lastInsertRowid as number, ...user };
  }

  async getCurrencies(): Promise<Currency[]> {
    const stmt = database.db.prepare('SELECT * FROM currencies');
    return stmt.all();
  }

  async getCurrency(id: number): Promise<Currency | undefined> {
    const stmt = database.db.prepare('SELECT * FROM currencies WHERE id = ?');
    return stmt.get(id);
  }

  async getCurrencyByCode(code: string): Promise<Currency | undefined> {
    const stmt = database.db.prepare('SELECT * FROM currencies WHERE code = ?');
    return stmt.get(code);
  }

  async createCurrency(currency: InsertCurrency): Promise<Currency> {
    const stmt = database.db.prepare(
      'INSERT INTO currencies (code, name, country, current_rate) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(
      currency.code,
      currency.name,
      currency.country,
      currency.currentRate
    );
    return { id: result.lastInsertRowid as number, ...currency };
  }

  async updateCurrencyRate(id: number, rate: number): Promise<Currency | undefined> {
    const stmt = database.db.prepare(
      'UPDATE currencies SET current_rate = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?'
    );
    stmt.run(rate, id);
    return this.getCurrency(id);
  }

  async getInventoryItems(): Promise<Inventory[]> {
    const stmt = database.db.prepare('SELECT * FROM inventory');
    return stmt.all();
  }

  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    const stmt = database.db.prepare('SELECT * FROM inventory WHERE id = ?');
    return stmt.get(id);
  }

  async getInventoryByCurrencyId(currencyId: number): Promise<Inventory | undefined> {
    const stmt = database.db.prepare('SELECT * FROM inventory WHERE currency_id = ?');
    return stmt.get(currencyId);
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const stmt = database.db.prepare(
      'INSERT INTO inventory (currency_id, amount, avg_buy_price) VALUES (?, ?, ?)'
    );
    const result = stmt.run(item.currencyId, item.amount, item.avgBuyPrice);
    return { id: result.lastInsertRowid as number, ...item };
  }

  async updateInventoryItem(id: number, amount: number, avgBuyPrice: number): Promise<Inventory | undefined> {
    const stmt = database.db.prepare(
      'UPDATE inventory SET amount = ?, avg_buy_price = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?'
    );
    stmt.run(amount, avgBuyPrice, id);
    return this.getInventoryItem(id);
  }

  async getTransactions(): Promise<Transaction[]> {
    const stmt = database.db.prepare('SELECT * FROM transactions ORDER BY timestamp DESC');
    return stmt.all();
  }

  async getTransactionsByCurrencyId(currencyId: number): Promise<Transaction[]> {
    const stmt = database.db.prepare(
      'SELECT * FROM transactions WHERE currency_id = ? ORDER BY timestamp DESC'
    );
    return stmt.all(currencyId);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const stmt = database.db.prepare(
      'INSERT INTO transactions (currency_id, type, amount, rate, total, notes, profit) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      transaction.currencyId,
      transaction.type,
      transaction.amount,
      transaction.rate,
      transaction.total,
      transaction.notes,
      transaction.profit
    );
    return { id: result.lastInsertRowid as number, ...transaction };
  }

  async getDailyStats(date: string): Promise<DailyStats | undefined> {
    const stmt = database.db.prepare('SELECT * FROM daily_stats WHERE date = ?');
    return stmt.get(date);
  }

  async createOrUpdateDailyStats(stats: InsertDailyStats): Promise<DailyStats> {
    const stmt = database.db.prepare(`
      INSERT INTO daily_stats (date, profit, transaction_count)
      VALUES (?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        profit = excluded.profit,
        transaction_count = excluded.transaction_count
    `);
    stmt.run(stats.date, stats.profit, stats.transactionCount);
    return this.getDailyStats(stats.date) as Promise<DailyStats>;
  }

  async getCurrenciesWithInventory(): Promise<CurrencyWithInventory[]> {
    const stmt = database.db.prepare(`
      SELECT c.*, i.*
      FROM currencies c
      LEFT JOIN inventory i ON c.id = i.currency_id
    `);
    return stmt.all();
  }

  async resetInventory(): Promise<void> {
    database.db.transaction(() => {
      database.db.prepare('DELETE FROM transactions').run();
      database.db.prepare('UPDATE inventory SET amount = 0').run();
      database.db.prepare('UPDATE daily_stats SET profit = 0, transaction_count = 0').run();
    })();
  }
}

export const storage = new SqliteStorage();