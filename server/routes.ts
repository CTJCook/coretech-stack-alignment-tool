import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertToolSchema, insertBaselineSchema, insertCustomerSchema } from "@shared/schema";
import { z } from "zod";

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
