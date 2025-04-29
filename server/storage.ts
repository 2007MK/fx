import { 
  users, type User, type InsertUser,
  currencies, type Currency, type InsertCurrency,
  inventory, type Inventory, type InsertInventory,
  inventoryBatches, type InventoryBatch, type InsertInventoryBatch,
  transactions, type Transaction, type InsertTransaction,
  dailyStats, type DailyStats, type InsertDailyStats,
  type CurrencyWithInventory
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // Initialization
  initialize?(): Promise<void>;
  
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
  updateInventoryItem(id: number, amount: number, avgBuyPrice: number, totalValue?: number): Promise<Inventory | undefined>;
  
  // Inventory batch methods
  getInventoryBatches?(currencyId: number): Promise<InventoryBatch[]>;
  createInventoryBatch?(batch: InsertInventoryBatch): Promise<InventoryBatch>;
  updateInventoryBatch?(id: number, remainingAmount: number): Promise<InventoryBatch>;
  
  // Transaction methods
  getTransactions(): Promise<Transaction[]>;
  getTransactionsByCurrencyId(currencyId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction?(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction?(id: number): Promise<boolean>;
  
  // Stats methods
  getDailyStats(date: string): Promise<DailyStats | undefined>;
  createOrUpdateDailyStats(stats: InsertDailyStats): Promise<DailyStats>;
  
  // Combined methods
  getCurrenciesWithInventory(): Promise<CurrencyWithInventory[]>;
  resetInventory(): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private currencies: Map<number, Currency>;
  private inventoryItems: Map<number, Inventory>;
  private transactionsList: Map<number, Transaction>;
  private stats: Map<string, DailyStats>;
  
  private userCurrentId: number;
  private currencyCurrentId: number;
  private inventoryCurrentId: number;
  private transactionCurrentId: number;
  private statsCurrentId: number;

  constructor() {
    this.users = new Map();
    this.currencies = new Map();
    this.inventoryItems = new Map();
    this.transactionsList = new Map();
    this.stats = new Map();
    
    this.userCurrentId = 1;
    this.currencyCurrentId = 1;
    this.inventoryCurrentId = 1;
    this.transactionCurrentId = 1;
    this.statsCurrentId = 1;
    
    // Initialize with some sample currencies
    this.initializeCurrencies();
  }
  
  private initializeCurrencies() {
    const sampleCurrencies = [
      { code: "USD", name: "US Dollar", country: "United States", currentRate: "83.45" },
      { code: "EUR", name: "Euro", country: "European Union", currentRate: "90.12" },
      { code: "GBP", name: "British Pound", country: "United Kingdom", currentRate: "105.78" },
      { code: "JPY", name: "Japanese Yen", country: "Japan", currentRate: "0.55" }
    ];
    
    for (const currency of sampleCurrencies) {
      const newCurrency = this.createCurrency(currency);
      
      // Create initial inventory with 0 amount
      this.createInventoryItem({
        currencyId: newCurrency.id,
        amount: "0",
        avgBuyPrice: currency.currentRate,
        totalValue: "0"
      });
    }
    
    // Initialize today's stats
    const today = new Date().toISOString().split('T')[0];
    this.createOrUpdateDailyStats({
      date: today,
      profit: 0,
      transactionCount: 0
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Currency methods
  async getCurrencies(): Promise<Currency[]> {
    return Array.from(this.currencies.values());
  }
  
  async getCurrency(id: number): Promise<Currency | undefined> {
    return this.currencies.get(id);
  }
  
  async getCurrencyByCode(code: string): Promise<Currency | undefined> {
    return Array.from(this.currencies.values()).find(
      (currency) => currency.code === code
    );
  }
  
  async createCurrency(insertCurrency: InsertCurrency): Promise<Currency> {
    const id = this.currencyCurrentId++;
    const now = new Date();
    const currency: Currency = { 
      ...insertCurrency, 
      id,
      lastUpdated: now
    };
    this.currencies.set(id, currency);
    return currency;
  }
  
  async updateCurrencyRate(id: number, rate: number): Promise<Currency | undefined> {
    const currency = this.currencies.get(id);
    if (!currency) return undefined;
    
    const updatedCurrency: Currency = {
      ...currency,
      currentRate: rate,
      lastUpdated: new Date()
    };
    
    this.currencies.set(id, updatedCurrency);
    return updatedCurrency;
  }
  
  // Inventory methods
  async getInventoryItems(): Promise<Inventory[]> {
    return Array.from(this.inventoryItems.values());
  }
  
  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    return this.inventoryItems.get(id);
  }
  
  async getInventoryByCurrencyId(currencyId: number): Promise<Inventory | undefined> {
    return Array.from(this.inventoryItems.values()).find(
      (item) => item.currencyId === currencyId
    );
  }
  
  async createInventoryItem(insertInventory: InsertInventory): Promise<Inventory> {
    const id = this.inventoryCurrentId++;
    const now = new Date();
    const inventoryItem: Inventory = {
      ...insertInventory,
      id,
      lastUpdated: now
    };
    
    this.inventoryItems.set(id, inventoryItem);
    return inventoryItem;
  }
  
  async updateInventoryItem(id: number, amount: number, avgBuyPrice: number, totalValue?: number): Promise<Inventory | undefined> {
    const inventoryItem = this.inventoryItems.get(id);
    if (!inventoryItem) return undefined;
    
    // Calculate total value if not provided
    const actualTotalValue = totalValue !== undefined ? totalValue : amount * avgBuyPrice;
    
    const updatedItem: Inventory = {
      ...inventoryItem,
      amount,
      avgBuyPrice,
      totalValue: actualTotalValue,
      lastUpdated: new Date()
    };
    
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }
  
  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactionsList.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Newest first
  }
  
  async getTransactionsByCurrencyId(currencyId: number): Promise<Transaction[]> {
    return Array.from(this.transactionsList.values())
      .filter(transaction => transaction.currencyId === currencyId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Newest first
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionCurrentId++;
    const now = new Date();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      timestamp: now
    };
    
    this.transactionsList.set(id, transaction);
    
    // Update daily stats
    const today = now.toISOString().split('T')[0];
    const dailyStat = await this.getDailyStats(today);
    
    if (dailyStat) {
      const profit = transaction.profit || 0;
      await this.createOrUpdateDailyStats({
        date: today,
        profit: Number(dailyStat.profit) + Number(profit),
        transactionCount: dailyStat.transactionCount + 1
      });
    } else {
      await this.createOrUpdateDailyStats({
        date: today,
        profit: Number(transaction.profit || 0),
        transactionCount: 1
      });
    }
    
    return transaction;
  }
  
  // Stats methods
  async getDailyStats(date: string): Promise<DailyStats | undefined> {
    return this.stats.get(date);
  }
  
  async createOrUpdateDailyStats(insertStats: InsertDailyStats): Promise<DailyStats> {
    const existingStat = this.stats.get(insertStats.date);
    
    if (existingStat) {
      const updatedStat: DailyStats = {
        ...existingStat,
        profit: insertStats.profit,
        transactionCount: insertStats.transactionCount
      };
      this.stats.set(insertStats.date, updatedStat);
      return updatedStat;
    }
    
    const id = this.statsCurrentId++;
    const stat: DailyStats = {
      ...insertStats,
      id
    };
    
    this.stats.set(insertStats.date, stat);
    return stat;
  }
  
  // Combined methods
  async getCurrenciesWithInventory(): Promise<CurrencyWithInventory[]> {
    const currencies = await this.getCurrencies();
    const result: CurrencyWithInventory[] = [];
    
    for (const currency of currencies) {
      const inventory = await this.getInventoryByCurrencyId(currency.id);
      result.push({
        ...currency,
        inventory
      });
    }
    
    return result;
  }
  
  async resetInventory(): Promise<void> {
    // Reset all inventory amounts to 0
    for (const [id, item] of this.inventoryItems.entries()) {
      const currency = await this.getCurrency(item.currencyId);
      if (currency) {
        await this.updateInventoryItem(id, 0, Number(currency.currentRate));
      }
    }
    
    // Clear all transactions
    this.transactionsList.clear();
    this.transactionCurrentId = 1;
    
    // Reset today's stats
    const today = new Date().toISOString().split('T')[0];
    await this.createOrUpdateDailyStats({
      date: today,
      profit: 0,
      transactionCount: 0
    });
  }
}

export const storage = new MemStorage();
