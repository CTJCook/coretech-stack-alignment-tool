import { db } from "../db";
import {
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Tool,
  type InsertTool,
  type Baseline,
  type InsertBaseline,
  type Customer,
  type InsertCustomer,
  users,
  categories,
  tools,
  baselines,
  customers,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  getAllTools(): Promise<Tool[]>;
  getToolsByCategory(categoryId: string): Promise<Tool[]>;
  getTool(id: string): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateTool(id: string, tool: Partial<InsertTool>): Promise<Tool | undefined>;
  deleteTool(id: string): Promise<boolean>;

  getAllBaselines(): Promise<Baseline[]>;
  getBaseline(id: string): Promise<Baseline | undefined>;
  createBaseline(baseline: InsertBaseline): Promise<Baseline>;
  updateBaseline(id: string, baseline: Partial<InsertBaseline>): Promise<Baseline | undefined>;
  deleteBaseline(id: string): Promise<boolean>;

  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  createManyCustomers(customers: InsertCustomer[]): Promise<Customer[]>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.sortOrder);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return result[0];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  async getAllTools(): Promise<Tool[]> {
    return db.select().from(tools);
  }

  async getToolsByCategory(categoryId: string): Promise<Tool[]> {
    return db.select().from(tools).where(eq(tools.categoryId, categoryId));
  }

  async getTool(id: string): Promise<Tool | undefined> {
    const result = await db.select().from(tools).where(eq(tools.id, id)).limit(1);
    return result[0];
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const result = await db.insert(tools).values(tool).returning();
    return result[0];
  }

  async updateTool(id: string, tool: Partial<InsertTool>): Promise<Tool | undefined> {
    const result = await db.update(tools).set(tool).where(eq(tools.id, id)).returning();
    return result[0];
  }

  async deleteTool(id: string): Promise<boolean> {
    const result = await db.delete(tools).where(eq(tools.id, id)).returning();
    return result.length > 0;
  }

  async getAllBaselines(): Promise<Baseline[]> {
    return db.select().from(baselines);
  }

  async getBaseline(id: string): Promise<Baseline | undefined> {
    const result = await db.select().from(baselines).where(eq(baselines.id, id)).limit(1);
    return result[0];
  }

  async createBaseline(baseline: InsertBaseline): Promise<Baseline> {
    const result = await db.insert(baselines).values(baseline).returning();
    return result[0];
  }

  async updateBaseline(id: string, baseline: Partial<InsertBaseline>): Promise<Baseline | undefined> {
    const result = await db.update(baselines).set(baseline).where(eq(baselines.id, id)).returning();
    return result[0];
  }

  async deleteBaseline(id: string): Promise<boolean> {
    const result = await db.delete(baselines).where(eq(baselines.id, id)).returning();
    return result.length > 0;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return result[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }

  async createManyCustomers(customerList: InsertCustomer[]): Promise<Customer[]> {
    if (customerList.length === 0) return [];
    const result = await db.insert(customers).values(customerList).returning();
    return result;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const result = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return result[0];
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DbStorage();
