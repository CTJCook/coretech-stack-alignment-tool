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

export const serviceTierEnum = z.enum(["Essentials", "MSP", "Break-Fix"]);

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  primaryContactName: text("primary_contact_name"),
  customerPhone: text("customer_phone"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  serviceTiers: text("service_tiers").array().notNull().default(sql`ARRAY[]::text[]`),
  currentToolIds: text("current_tool_ids").array().notNull().default(sql`ARRAY[]::text[]`),
  baselineId: varchar("baseline_id").notNull().references(() => baselines.id, { onDelete: "restrict" }),
  cwCompanyId: integer("cw_company_id"),
  cwLastSyncAt: text("cw_last_sync_at"),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true }).extend({
  serviceTiers: z.array(serviceTierEnum).min(1, "Select at least one service tier"),
  address: z.string().nullable().optional(),
  primaryContactName: z.string().nullable().optional(),
  customerPhone: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// ConnectWise Integration Tables
export const connectwiseSettings = pgTable("connectwise_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: text("company_id").notNull(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  siteUrl: text("site_url").notNull(),
  clientId: text("client_id").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  lastSyncAt: text("last_sync_at"),
  lastSyncStatus: text("last_sync_status"),
  lastSyncMessage: text("last_sync_message"),
});

export const insertConnectwiseSettingsSchema = createInsertSchema(connectwiseSettings).omit({ id: true }).extend({
  privateKey: z.string().optional(),
});
export type InsertConnectwiseSettings = z.infer<typeof insertConnectwiseSettingsSchema>;
export type ConnectwiseSettings = typeof connectwiseSettings.$inferSelect;

// Map ConnectWise company types to baselines
export const connectwiseTypeMappings = pgTable("connectwise_type_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cwTypeName: text("cw_type_name").notNull().unique(),
  baselineId: varchar("baseline_id").references(() => baselines.id, { onDelete: "set null" }),
  serviceTiers: text("service_tiers").array().notNull().default(sql`ARRAY['Essentials']::text[]`),
  shouldImport: boolean("should_import").notNull().default(true),
});

export const insertConnectwiseTypeMappingSchema = createInsertSchema(connectwiseTypeMappings).omit({ id: true });
export type InsertConnectwiseTypeMapping = z.infer<typeof insertConnectwiseTypeMappingSchema>;
export type ConnectwiseTypeMapping = typeof connectwiseTypeMappings.$inferSelect;

// Map ConnectWise SKUs to tools
export const connectwiseSkuMappings = pgTable("connectwise_sku_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: text("sku").notNull().unique(),
  skuDescription: text("sku_description"),
  toolId: varchar("tool_id").references(() => tools.id, { onDelete: "cascade" }),
});

export const insertConnectwiseSkuMappingSchema = createInsertSchema(connectwiseSkuMappings).omit({ id: true });
export type InsertConnectwiseSkuMapping = z.infer<typeof insertConnectwiseSkuMappingSchema>;
export type ConnectwiseSkuMapping = typeof connectwiseSkuMappings.$inferSelect;

// Sync log for tracking imports
export const connectwiseSyncLogs = pgTable("connectwise_sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  status: text("status").notNull().default("running"),
  companiesFound: integer("companies_found").default(0),
  companiesImported: integer("companies_imported").default(0),
  companiesUpdated: integer("companies_updated").default(0),
  companiesSkipped: integer("companies_skipped").default(0),
  agreementsProcessed: integer("agreements_processed").default(0),
  toolsActivated: integer("tools_activated").default(0),
  errors: text("errors").array().default(sql`ARRAY[]::text[]`),
});
