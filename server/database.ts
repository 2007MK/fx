
import Database from 'better-sqlite3';
import path from 'path';

const DB_KEY = process.env.DB_KEY || 'default-encryption-key-change-this';
const DB_PATH = path.join(process.cwd(), 'data.db');

export class SqliteStorage {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.db.pragma(`key='${DB_KEY}'`);
    this.initializeTables();
  }

  private initializeTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    // Currencies table  
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS currencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        current_rate DECIMAL NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inventory table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        currency_id INTEGER NOT NULL,
        amount DECIMAL NOT NULL DEFAULT 0,
        avg_buy_price DECIMAL NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(currency_id) REFERENCES currencies(id)
      )
    `);

    // Transactions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        currency_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount DECIMAL NOT NULL,
        rate DECIMAL NOT NULL,
        total DECIMAL NOT NULL,
        notes TEXT,
        profit DECIMAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(currency_id) REFERENCES currencies(id)
      )
    `);

    // Daily stats table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        profit DECIMAL NOT NULL DEFAULT 0,
        transaction_count INTEGER NOT NULL DEFAULT 0
      )
    `);
  }

  // Add methods to match your existing storage interface
  close() {
    this.db.close();
  }
}

export const database = new SqliteStorage();
