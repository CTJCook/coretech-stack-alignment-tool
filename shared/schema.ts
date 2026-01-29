import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export const tools = pgTable("tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  vendor: text("vendor"),
  categoryId: varchar("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
});

export const insertToolSchema = createInsertSchema(tools).omit({ id: true });
export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof tools.$inferSelect;

export const baselines = pgTable("baselines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  requiredToolIds: text("required_tool_ids").array().notNull().default(sql`ARRAY[]::text[]`),
  optionalToolIds: text("optional_tool_ids").array().notNull().default(sql`ARRAY[]::text[]`),
});

export const insertBaselineSchema = createInsertSchema(baselines).omit({ id: true });
export type InsertBaseline = z.infer<typeof insertBaselineSchema>;
export type Baseline = typeof baselines.$inferSelect;

export const customerTypeEnum = z.enum(["SMB", "Compliance", "Co-Managed", "MSP"]);

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  currentToolIds: text("current_tool_ids").array().notNull().default(sql`ARRAY[]::text[]`),
  baselineId: varchar("baseline_id").notNull().references(() => baselines.id, { onDelete: "restrict" }),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true }).extend({
  type: customerTypeEnum,
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
