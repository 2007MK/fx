import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (keeping the existing one)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Currency schema
export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  currentRate: numeric("current_rate").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertCurrencySchema = createInsertSchema(currencies).pick({
  code: true,
  name: true,
  country: true,
  currentRate: true,
});

// Inventory schema
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  currencyId: integer("currency_id").notNull(),
  amount: numeric("amount").notNull(),
  avgBuyPrice: numeric("avg_buy_price").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventory).pick({
  currencyId: true,
  amount: true,
  avgBuyPrice: true,
});

// Transaction schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  currencyId: integer("currency_id").notNull(),
  type: text("type").notNull(), // "BUY" or "SELL"
  amount: numeric("amount").notNull(),
  rate: numeric("rate").notNull(),
  total: numeric("total").notNull(),
  notes: text("notes"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  profit: numeric("profit"),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  currencyId: true,
  type: true,
  amount: true,
  rate: true,
  total: true,
  notes: true,
  profit: true,
});

// Stats schema for daily profit tracking
export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(), // YYYY-MM-DD format
  profit: numeric("profit").notNull(),
  transactionCount: integer("transaction_count").notNull(),
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats).pick({
  date: true,
  profit: true,
  transactionCount: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = z.infer<typeof insertCurrencySchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type DailyStats = typeof dailyStats.$inferSelect;
export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;

// Extended types for frontend use
export type CurrencyWithInventory = Currency & {
  inventory?: Inventory;
};
