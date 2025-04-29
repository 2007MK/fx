import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";

// Add test currency on startup if none exist
async function addTestCurrencyIfEmpty() {
  const currencies = await storage.getCurrencies();
  if (currencies.length === 0) {
    const usdCurrency = await storage.createCurrency({
      code: "USD",
      name: "US Dollar",
      country: "United States",
      currentRate: "82.50"
    });
    
    await storage.createInventoryItem({
      currencyId: usdCurrency.id,
      amount: "0",
      avgBuyPrice: usdCurrency.currentRate
    });
  }
}

import {
  insertCurrencySchema,
  insertTransactionSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  await addTestCurrencyIfEmpty();
  // Get all currencies with inventory info
  app.get("/api/currencies", async (_req: Request, res: Response) => {
    try {
      const currencies = await storage.getCurrenciesWithInventory();
      res.json(currencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve currencies" });
    }
  });

  // Add a new currency
  app.post("/api/currencies", async (req: Request, res: Response) => {
    try {
      // Convert numeric values to strings if needed
      const { code, name, country, currentRate } = req.body;
      
      const currencyData = insertCurrencySchema.parse({
        code, 
        name, 
        country,
        currentRate: typeof currentRate === 'number' ? currentRate.toString() : currentRate
      });
      
      // Check if currency code already exists
      const existingCurrency = await storage.getCurrencyByCode(currencyData.code);
      if (existingCurrency) {
        return res.status(400).json({ message: "Currency code already exists" });
      }
      
      const currency = await storage.createCurrency(currencyData);
      
      // Create inventory entry with 0 amount
      await storage.createInventoryItem({
        currencyId: currency.id,
        amount: "0",
        avgBuyPrice: currency.currentRate
      });
      
      res.status(201).json(currency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid currency data", errors: error.errors });
      } else {
        console.error('Currency creation error:', error);
        res.status(500).json({ message: "Failed to create currency" });
      }
    }
  });

  // Update currency rate
  app.patch("/api/currencies/:id/rate", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { rate } = req.body;
      
      if (isNaN(id) || typeof rate !== 'number') {
        return res.status(400).json({ message: "Invalid ID or rate" });
      }
      
      const currency = await storage.updateCurrencyRate(id, rate);
      
      if (!currency) {
        return res.status(404).json({ message: "Currency not found" });
      }
      
      res.json(currency);
    } catch (error) {
      res.status(500).json({ message: "Failed to update currency rate" });
    }
  });

  // Get all transactions
  app.get("/api/transactions", async (_req: Request, res: Response) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve transactions" });
    }
  });

  // Create a new transaction (BUY)
  app.post("/api/transactions/buy", async (req: Request, res: Response) => {
    try {
      // Handle numeric conversions for Zod
      const { currencyId, amount, rate, total, notes } = req.body;
      
      const transactionData = insertTransactionSchema.parse({
        currencyId,
        type: "BUY",
        amount: typeof amount === 'number' ? amount.toString() : amount,
        rate: typeof rate === 'number' ? rate.toString() : rate,
        total: typeof total === 'number' ? total.toString() : total,
        notes,
        profit: "0" // No profit for buys
      });
      
      // Get the currency
      const currency = await storage.getCurrency(currencyId);
      if (!currency) {
        return res.status(404).json({ message: "Currency not found" });
      }
      
      // Get or create inventory item
      let inventoryItem = await storage.getInventoryByCurrencyId(currencyId);
      
      if (!inventoryItem) {
        inventoryItem = await storage.createInventoryItem({
          currencyId,
          amount: "0",
          avgBuyPrice: typeof rate === 'number' ? rate.toString() : rate
        });
      }
      
      // Calculate new average buy price
      const currentTotalValue = Number(inventoryItem.amount) * Number(inventoryItem.avgBuyPrice);
      const newValue = Number(amount) * Number(rate);
      const newTotalAmount = Number(inventoryItem.amount) + Number(amount);
      const newAvgBuyPrice = newTotalAmount > 0 
        ? (currentTotalValue + newValue) / newTotalAmount 
        : Number(rate);
      
      // Update inventory
      await storage.updateInventoryItem(
        inventoryItem.id,
        newTotalAmount,
        newAvgBuyPrice
      );
      
      // Create transaction
      const transaction = await storage.createTransaction(transactionData);
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        console.error('Buy transaction error:', error);
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  // Create a new transaction (SELL)
  app.post("/api/transactions/sell", async (req: Request, res: Response) => {
    try {
      const { currencyId, amount, rate, total, notes } = req.body;
      
      // Get inventory item
      const inventoryItem = await storage.getInventoryByCurrencyId(currencyId);
      
      if (!inventoryItem) {
        return res.status(404).json({ message: "Inventory not found for this currency" });
      }
      
      // Check if there's enough in stock
      if (Number(inventoryItem.amount) < Number(amount)) {
        return res.status(400).json({ 
          message: "Not enough currency in stock",
          available: inventoryItem.amount
        });
      }
      
      // Calculate profit
      const profit = Number(amount) * (Number(rate) - Number(inventoryItem.avgBuyPrice));
      
      const transactionData = insertTransactionSchema.parse({
        currencyId,
        type: "SELL",
        amount: typeof amount === 'number' ? amount.toString() : amount,
        rate: typeof rate === 'number' ? rate.toString() : rate,
        total: typeof total === 'number' ? total.toString() : total,
        notes,
        profit: profit.toString()
      });
      
      // Update inventory
      const newAmount = Number(inventoryItem.amount) - Number(amount);
      await storage.updateInventoryItem(
        inventoryItem.id,
        newAmount,
        Number(inventoryItem.avgBuyPrice) // Keep the same avg buy price
      );
      
      // Create transaction
      const transaction = await storage.createTransaction(transactionData);
      
      // Update daily stats with profit
      const today = new Date().toISOString().split('T')[0];
      const dailyStats = await storage.getDailyStats(today);
      
      if (dailyStats) {
        await storage.createOrUpdateDailyStats({
          date: today,
          profit: (Number(dailyStats.profit) + profit).toString(),
          transactionCount: dailyStats.transactionCount + 1
        });
      } else {
        await storage.createOrUpdateDailyStats({
          date: today,
          profit: profit.toString(),
          transactionCount: 1
        });
      }
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        console.error('Sell transaction error:', error);
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  // Get today's stats
  app.get("/api/stats/today", async (_req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stats = await storage.getDailyStats(today);
      
      if (!stats) {
        return res.status(404).json({ message: "No stats for today" });
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve today's stats" });
    }
  });

  // Reset inventory
  app.post("/api/reset", async (_req: Request, res: Response) => {
    try {
      await storage.resetInventory();
      res.json({ message: "Inventory has been reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset inventory" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
