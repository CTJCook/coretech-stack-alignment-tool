import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertToolSchema, insertBaselineSchema, insertCustomerSchema, serviceTierEnum, insertConnectwiseSettingsSchema, insertConnectwiseTypeMappingSchema, insertConnectwiseSkuMappingSchema } from "@shared/schema";
import { z } from "zod";
import * as XLSX from "xlsx";
import { createConnectwiseClient } from "./connectwise-api";
import { runConnectwiseSync, getSyncProgress } from "./connectwise-sync";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const category = insertCategorySchema.parse(req.body);
      const created = await storage.createCategory(category);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const updated = await storage.updateCategory(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: "Category not found" });
      } else {
        res.json(updated);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCategory(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Category not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Tools API
  app.get("/api/tools", async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const tools = categoryId 
        ? await storage.getToolsByCategory(categoryId)
        : await storage.getAllTools();
      res.json(tools);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tools" });
    }
  });

  app.post("/api/tools", async (req, res) => {
    try {
      const tool = insertToolSchema.parse(req.body);
      const created = await storage.createTool(tool);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create tool" });
      }
    }
  });

  app.patch("/api/tools/:id", async (req, res) => {
    try {
      const updated = await storage.updateTool(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: "Tool not found" });
      } else {
        res.json(updated);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update tool" });
    }
  });

  app.delete("/api/tools/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTool(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Tool not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete tool" });
    }
  });

  // Baselines API
  app.get("/api/baselines", async (req, res) => {
    try {
      const baselines = await storage.getAllBaselines();
      res.json(baselines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch baselines" });
    }
  });

  app.get("/api/baselines/:id", async (req, res) => {
    try {
      const baseline = await storage.getBaseline(req.params.id);
      if (!baseline) {
        res.status(404).json({ error: "Baseline not found" });
      } else {
        res.json(baseline);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch baseline" });
    }
  });

  app.post("/api/baselines", async (req, res) => {
    try {
      const baseline = insertBaselineSchema.parse(req.body);
      const created = await storage.createBaseline(baseline);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create baseline" });
      }
    }
  });

  app.patch("/api/baselines/:id", async (req, res) => {
    try {
      const updated = await storage.updateBaseline(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: "Baseline not found" });
      } else {
        res.json(updated);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update baseline" });
    }
  });

  app.delete("/api/baselines/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBaseline(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Baseline not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete baseline" });
    }
  });

  // Customers API
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        res.status(404).json({ error: "Customer not found" });
      } else {
        res.json(customer);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customer = insertCustomerSchema.parse(req.body);
      const created = await storage.createCustomer(customer);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create customer" });
      }
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const updated = await storage.updateCustomer(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: "Customer not found" });
      } else {
        res.json(updated);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCustomer(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Customer not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Bulk Import Customers API
  app.post("/api/customers/import", async (req, res) => {
    try {
      const { data } = req.body;
      
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: "Invalid data format. Expected array of customer records." });
      }

      // Get default baseline
      const allBaselines = await storage.getAllBaselines();
      const defaultBaseline = allBaselines.find(b => b.name.includes("Standard") || b.name.includes("SMB")) || allBaselines[0];
      
      if (!defaultBaseline) {
        return res.status(400).json({ error: "No baseline available. Please create a baseline first." });
      }

      // Helper to safely convert any value to trimmed string or null
      const toStr = (v: any): string | null => {
        if (v == null || v === "") return null;
        return String(v).trim() || null;
      };

      const validTiers = ["Essentials", "MSP", "Break-Fix"] as const;
      const results = {
        imported: 0,
        errors: [] as { row: number; error: string }[],
      };

      const validCustomers: any[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 1;

        // Validate required fields
        const customerName = toStr(row.name);
        if (!customerName) {
          results.errors.push({ row: rowNum, error: "Customer name is required" });
          continue;
        }

        // Parse service tiers
        let serviceTiers: ("Essentials" | "MSP" | "Break-Fix")[] = ["Essentials"];
        const tierValue = toStr(row.serviceTiers);
        if (tierValue) {
          const parsed = tierValue.split(/[,;|]/).map(t => t.trim()).filter(Boolean);
          const validParsed = parsed.filter(t => validTiers.includes(t as any)) as ("Essentials" | "MSP" | "Break-Fix")[];
          if (validParsed.length > 0) {
            serviceTiers = validParsed;
          }
        }

        // Find matching baseline
        let baselineId = defaultBaseline.id;
        const baselineValue = toStr(row.baseline);
        if (baselineValue) {
          const matchedBaseline = allBaselines.find(b => 
            b.name.toLowerCase().includes(baselineValue.toLowerCase())
          );
          if (matchedBaseline) {
            baselineId = matchedBaseline.id;
          }
        }

        validCustomers.push({
          name: customerName,
          address: toStr(row.address),
          primaryContactName: toStr(row.primaryContactName) || toStr(row.contactName),
          customerPhone: toStr(row.customerPhone) || toStr(row.phone),
          contactPhone: toStr(row.contactPhone),
          contactEmail: toStr(row.contactEmail) || toStr(row.email),
          serviceTiers,
          currentToolIds: [],
          baselineId,
        });
      }

      // Bulk insert valid customers
      if (validCustomers.length > 0) {
        const created = await storage.createManyCustomers(validCustomers);
        results.imported = created.length;
      }

      res.json({
        success: true,
        imported: results.imported,
        errors: results.errors,
        total: data.length,
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to import customers" });
    }
  });

  // Parse Excel/CSV file upload
  app.post("/api/customers/parse-file", async (req, res) => {
    try {
      const { fileData, fileName } = req.body;
      
      if (!fileData) {
        return res.status(400).json({ error: "No file data provided" });
      }

      // Parse base64 file data
      const buffer = Buffer.from(fileData, "base64");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      if (jsonData.length === 0) {
        return res.status(400).json({ error: "Empty file" });
      }

      // First row is headers
      const headers = jsonData[0].map((h: any) => String(h || "").trim());
      const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ""));

      // Check for usable headers
      if (headers.length === 0 || headers.every(h => !h)) {
        return res.status(400).json({ error: "No valid column headers found in file" });
      }

      // Map headers to our expected fields
      const columnMapping: Record<string, string> = {};
      
      headers.forEach((header) => {
        const normalized = header.toLowerCase().replace(/[_\s-]/g, "");
        
        // Exact matches first
        if (normalized === "name" || normalized === "customername" || normalized === "company" || normalized === "customer") {
          columnMapping[header] = "name";
        } else if (normalized === "address" || normalized === "customeraddress") {
          columnMapping[header] = "address";
        } else if (normalized === "primarycontactname" || normalized === "contactname" || normalized === "contact") {
          columnMapping[header] = "primaryContactName";
        } else if (normalized === "customerphone" || normalized === "phone" || normalized === "mainphone") {
          columnMapping[header] = "customerPhone";
        } else if (normalized === "contactphone") {
          columnMapping[header] = "contactPhone";
        } else if (normalized === "contactemail" || normalized === "email") {
          columnMapping[header] = "contactEmail";
        } else if (normalized === "servicetiers" || normalized === "tiers" || normalized === "tier" || normalized === "bundle" || normalized === "bundles") {
          columnMapping[header] = "serviceTiers";
        } else if (normalized === "baseline") {
          columnMapping[header] = "baseline";
        }
      });

      // Convert rows to objects
      const data = rows.map(row => {
        const obj: Record<string, any> = {};
        headers.forEach((header, index) => {
          const field = columnMapping[header] || header;
          if (row[index] !== undefined && row[index] !== "") {
            obj[field] = row[index];
          }
        });
        return obj;
      });

      // Check if we have any meaningful column mappings (at minimum need 'name')
      const hasNameColumn = Object.values(columnMapping).includes("name");
      if (!hasNameColumn) {
        return res.status(400).json({ 
          error: "Could not find a 'name' or 'company' column. Please ensure your file has a column for customer names." 
        });
      }

      res.json({
        headers,
        columnMapping,
        data,
        rowCount: data.length,
      });
    } catch (error) {
      console.error("Parse file error:", error);
      res.status(500).json({ error: "Failed to parse file" });
    }
  });

  // ConnectWise Settings API
  app.get("/api/connectwise/settings", async (req, res) => {
    try {
      const settings = await storage.getConnectwiseSettings();
      if (settings) {
        const { privateKey, ...safeSettings } = settings;
        res.json({ ...safeSettings, hasPrivateKey: !!privateKey });
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ConnectWise settings" });
    }
  });

  app.post("/api/connectwise/settings", async (req, res) => {
    try {
      const settings = insertConnectwiseSettingsSchema.parse(req.body);
      const created = await storage.saveConnectwiseSettings(settings);
      const { privateKey, ...safeSettings } = created;
      res.status(201).json({ ...safeSettings, hasPrivateKey: !!privateKey });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to save ConnectWise settings" });
      }
    }
  });

  app.post("/api/connectwise/test-connection", async (req, res) => {
    try {
      const { companyId, publicKey, privateKey, siteUrl, clientId, useExistingKey } = req.body;
      
      let actualPrivateKey = privateKey;
      
      if (useExistingKey && !privateKey) {
        const settings = await storage.getConnectwiseSettings();
        if (settings) {
          actualPrivateKey = settings.privateKey;
        }
      }
      
      if (!companyId || !publicKey || !actualPrivateKey || !siteUrl || !clientId) {
        return res.status(400).json({ error: "Missing required credentials" });
      }

      const client = createConnectwiseClient({
        companyId,
        publicKey,
        privateKey: actualPrivateKey,
        siteUrl,
        clientId,
      });

      const result = await client.testConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Connection test failed" 
      });
    }
  });

  app.get("/api/connectwise/company-types", async (req, res) => {
    try {
      const settings = await storage.getConnectwiseSettings();
      if (!settings) {
        return res.status(400).json({ error: "ConnectWise settings not configured" });
      }

      const client = createConnectwiseClient({
        companyId: settings.companyId,
        publicKey: settings.publicKey,
        privateKey: settings.privateKey,
        siteUrl: settings.siteUrl,
        clientId: settings.clientId,
      });

      const types = await client.getCompanyTypes();
      res.json(types);
    } catch (error) {
      console.error("Failed to fetch company types:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch company types" });
    }
  });

  // ConnectWise Type Mappings API
  app.get("/api/connectwise/type-mappings", async (req, res) => {
    try {
      const mappings = await storage.getAllTypeMappings();
      res.json(mappings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch type mappings" });
    }
  });

  app.post("/api/connectwise/type-mappings", async (req, res) => {
    try {
      const mapping = insertConnectwiseTypeMappingSchema.parse(req.body);
      const created = await storage.createTypeMapping(mapping);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create type mapping" });
      }
    }
  });

  app.patch("/api/connectwise/type-mappings/:id", async (req, res) => {
    try {
      const updated = await storage.updateTypeMapping(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: "Type mapping not found" });
      } else {
        res.json(updated);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update type mapping" });
    }
  });

  app.delete("/api/connectwise/type-mappings/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTypeMapping(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Type mapping not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete type mapping" });
    }
  });

  // ConnectWise SKU Mappings API
  app.get("/api/connectwise/sku-mappings", async (req, res) => {
    try {
      const mappings = await storage.getAllSkuMappings();
      res.json(mappings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch SKU mappings" });
    }
  });

  app.post("/api/connectwise/sku-mappings", async (req, res) => {
    try {
      const mapping = insertConnectwiseSkuMappingSchema.parse(req.body);
      const created = await storage.createSkuMapping(mapping);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create SKU mapping" });
      }
    }
  });

  app.patch("/api/connectwise/sku-mappings/:id", async (req, res) => {
    try {
      const updated = await storage.updateSkuMapping(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: "SKU mapping not found" });
      } else {
        res.json(updated);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update SKU mapping" });
    }
  });

  app.delete("/api/connectwise/sku-mappings/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSkuMapping(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "SKU mapping not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete SKU mapping" });
    }
  });

  // ConnectWise Sync API
  app.post("/api/connectwise/sync", async (req, res) => {
    try {
      const result = await runConnectwiseSync();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Sync failed" 
      });
    }
  });

  app.get("/api/connectwise/sync-progress", async (req, res) => {
    try {
      const progress = getSyncProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to get sync progress" });
    }
  });

  // Gap Analysis API
  app.get("/api/customers/:id/gap-report", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const baseline = await storage.getBaseline(customer.baselineId);
      if (!baseline) {
        return res.status(404).json({ error: "Baseline not found" });
      }

      const allTools = await storage.getAllTools();
      const categories = await storage.getAllCategories();

      const currentToolIds = new Set(customer.currentToolIds);
      const requiredToolIds = new Set(baseline.requiredToolIds);
      const optionalToolIds = new Set(baseline.optionalToolIds);

      // Calculate missing tools
      const missingRequired = baseline.requiredToolIds.filter(id => !currentToolIds.has(id));
      const missingOptional = baseline.optionalToolIds.filter(id => !currentToolIds.has(id));

      // Calculate coverage
      const requiredCoverage = requiredToolIds.size > 0 
        ? ((requiredToolIds.size - missingRequired.length) / requiredToolIds.size) * 100
        : 100;

      const totalBaseline = requiredToolIds.size + optionalToolIds.size;
      const totalMissing = missingRequired.length + missingOptional.length;
      const overallCoverage = totalBaseline > 0 
        ? ((totalBaseline - totalMissing) / totalBaseline) * 100
        : 100;

      // Category-level coverage
      const categoryMap = new Map(categories.map(c => [c.id, c]));
      const categoryCoverage = categories.map(category => {
        const categoryTools = allTools.filter(t => t.categoryId === category.id);
        const categoryToolIds = new Set(categoryTools.map(t => t.id));
        
        const requiredInCategory = baseline.requiredToolIds.filter(id => categoryToolIds.has(id));
        const optionalInCategory = baseline.optionalToolIds.filter(id => categoryToolIds.has(id));
        const currentInCategory = customer.currentToolIds.filter(id => categoryToolIds.has(id));
        
        const totalInCategory = requiredInCategory.length + optionalInCategory.length;
        const coverage = totalInCategory > 0 
          ? (currentInCategory.length / totalInCategory) * 100
          : 0;

        return {
          categoryId: category.id,
          categoryName: category.name,
          coverage: Math.round(coverage),
          hasTools: totalInCategory > 0,
        };
      }).filter(c => c.hasTools);

      // Build missing tools details
      const missingToolsDetails = {
        required: missingRequired.map(id => allTools.find(t => t.id === id)).filter(Boolean),
        optional: missingOptional.map(id => allTools.find(t => t.id === id)).filter(Boolean),
      };

      res.json({
        customer,
        baseline,
        coverage: {
          overall: Math.round(overallCoverage),
          required: Math.round(requiredCoverage),
          byCategory: categoryCoverage,
        },
        missingTools: missingToolsDetails,
        totalRequired: requiredToolIds.size,
        totalOptional: optionalToolIds.size,
        missingRequiredCount: missingRequired.length,
        missingOptionalCount: missingOptional.length,
      });
    } catch (error) {
      console.error("Gap report error:", error);
      res.status(500).json({ error: "Failed to generate gap report" });
    }
  });

  return httpServer;
}
