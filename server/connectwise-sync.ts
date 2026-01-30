import { storage } from "./storage";
import { ConnectwiseApiClient, createConnectwiseClient, type CWCompany } from "./connectwise-api";
import type { ConnectwiseSettings, ConnectwiseTypeMapping, ConnectwiseSkuMapping, InsertCustomer } from "@shared/schema";
import { db } from "../db";
import { connectwiseSyncLogs } from "@shared/schema";

interface SyncResult {
  success: boolean;
  companiesFound: number;
  companiesImported: number;
  companiesUpdated: number;
  companiesSkipped: number;
  agreementsProcessed: number;
  toolsActivated: number;
  errors: string[];
  duration: number;
}

interface SyncProgress {
  status: string;
  currentStep: string;
  companiesProcessed: number;
  companiesTotal: number;
  errors: string[];
}

let currentSyncProgress: SyncProgress | null = null;

export function getSyncProgress(): SyncProgress | null {
  return currentSyncProgress;
}

export async function runConnectwiseSync(): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  currentSyncProgress = {
    status: "running",
    currentStep: "Initializing",
    companiesProcessed: 0,
    companiesTotal: 0,
    errors: [],
  };

  try {
    const settings = await storage.getConnectwiseSettings();
    if (!settings) {
      throw new Error("ConnectWise settings not configured");
    }

    if (!settings.enabled) {
      throw new Error("ConnectWise integration is not enabled");
    }

    const client = createConnectwiseClient({
      companyId: settings.companyId,
      publicKey: settings.publicKey,
      privateKey: settings.privateKey,
      siteUrl: settings.siteUrl,
      clientId: settings.clientId,
    });

    currentSyncProgress.currentStep = "Testing connection";

    const connectionTest = await client.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Connection failed: ${connectionTest.message}`);
    }

    currentSyncProgress.currentStep = "Fetching company type mappings";

    const typeMappings = await storage.getAllTypeMappings();
    const skuMappings = await storage.getAllSkuMappings();
    const allTools = await storage.getAllTools();
    const baselines = await storage.getAllBaselines();

    const importableTypes = typeMappings.filter(m => m.shouldImport).map(m => m.cwTypeName);

    if (importableTypes.length === 0) {
      throw new Error("No company types configured for import. Please set up type mappings first.");
    }

    currentSyncProgress.currentStep = "Fetching companies from ConnectWise";

    const companies = await client.getAllCompaniesWithPagination(
      undefined,
      (current, total) => {
        currentSyncProgress!.companiesProcessed = current;
        currentSyncProgress!.companiesTotal = total;
      }
    );

    currentSyncProgress.companiesTotal = companies.length;

    const result: SyncResult = {
      success: true,
      companiesFound: companies.length,
      companiesImported: 0,
      companiesUpdated: 0,
      companiesSkipped: 0,
      agreementsProcessed: 0,
      toolsActivated: 0,
      errors: [],
      duration: 0,
    };

    currentSyncProgress.currentStep = "Processing companies";

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      currentSyncProgress.companiesProcessed = i + 1;

      try {
        const companyTypes = company.types?.map(t => t.name) || [];
        const matchingType = companyTypes.find(t => importableTypes.includes(t));

        if (!matchingType) {
          result.companiesSkipped++;
          continue;
        }

        const typeMapping = typeMappings.find(m => m.cwTypeName === matchingType);
        if (!typeMapping) {
          result.companiesSkipped++;
          continue;
        }

        const existingCustomer = await storage.getCustomerByCwId(company.id);

        let contactName: string | null = null;
        let contactEmail: string | null = null;
        let contactPhone: string | null = null;

        if (company.defaultContact?.id) {
          try {
            const contact = await client.getCompanyContact(company.defaultContact.id);
            contactName = `${contact.firstName} ${contact.lastName}`.trim();
            
            const emailItem = contact.communicationItems?.find(c => 
              c.type.name.toLowerCase().includes('email') && c.defaultFlag
            ) || contact.communicationItems?.find(c => 
              c.type.name.toLowerCase().includes('email')
            );
            if (emailItem) contactEmail = emailItem.value;

            const phoneItem = contact.communicationItems?.find(c => 
              c.type.name.toLowerCase().includes('phone') && c.defaultFlag
            ) || contact.communicationItems?.find(c => 
              c.type.name.toLowerCase().includes('phone')
            );
            if (phoneItem) contactPhone = phoneItem.value;
          } catch (e) {
            console.warn(`Failed to fetch contact for company ${company.id}:`, e);
          }
        }

        const address = [
          company.addressLine1,
          company.city,
          company.state,
          company.zip,
        ].filter(Boolean).join(', ');

        const productSkus = await client.getCompanyProductSKUs(company.id);
        result.agreementsProcessed++;

        const activatedToolIds: string[] = [];
        for (const sku of productSkus) {
          const skuMapping = skuMappings.find(m => m.sku === sku);
          if (skuMapping?.toolId) {
            const tool = allTools.find(t => t.id === skuMapping.toolId);
            if (tool) {
              activatedToolIds.push(tool.id);
              result.toolsActivated++;
            }
          }
        }

        let baselineId = typeMapping.baselineId;
        if (!baselineId && baselines.length > 0) {
          const defaultBaseline = baselines.find(b => b.name.includes("Standard")) || baselines[0];
          baselineId = defaultBaseline.id;
        }

        if (!baselineId) {
          errors.push(`No baseline available for company ${company.name}`);
          result.companiesSkipped++;
          continue;
        }

        const serviceTiers = (typeMapping.serviceTiers || ["Essentials"]) as ("Essentials" | "MSP" | "Break-Fix")[];

        if (existingCustomer) {
          await storage.updateCustomer(existingCustomer.id, {
            name: company.name,
            address: address || null,
            primaryContactName: contactName,
            customerPhone: company.phoneNumber || null,
            contactPhone,
            contactEmail,
            serviceTiers,
            currentToolIds: Array.from(new Set([...existingCustomer.currentToolIds, ...activatedToolIds])),
            baselineId,
            cwLastSyncAt: new Date().toISOString(),
          });
          result.companiesUpdated++;
        } else {
          const newCustomer: InsertCustomer = {
            name: company.name,
            address: address || null,
            primaryContactName: contactName,
            customerPhone: company.phoneNumber || null,
            contactPhone,
            contactEmail,
            serviceTiers,
            currentToolIds: activatedToolIds,
            baselineId,
            cwCompanyId: company.id,
            cwLastSyncAt: new Date().toISOString(),
          };
          await storage.createCustomer(newCustomer);
          result.companiesImported++;
        }
      } catch (error) {
        const errorMsg = `Error processing company ${company.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    result.errors = errors;
    result.duration = Date.now() - startTime;
    result.success = errors.length === 0;

    await db.insert(connectwiseSyncLogs).values({
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      status: result.success ? "completed" : "completed_with_errors",
      companiesFound: result.companiesFound,
      companiesImported: result.companiesImported,
      companiesUpdated: result.companiesUpdated,
      companiesSkipped: result.companiesSkipped,
      agreementsProcessed: result.agreementsProcessed,
      toolsActivated: result.toolsActivated,
      errors: result.errors,
    });

    await storage.updateConnectwiseSettings(settings.id, {
      lastSyncAt: new Date().toISOString(),
      lastSyncStatus: result.success ? "success" : "completed_with_errors",
      lastSyncMessage: `Imported ${result.companiesImported}, updated ${result.companiesUpdated}, skipped ${result.companiesSkipped}`,
    });

    currentSyncProgress = {
      status: "completed",
      currentStep: "Sync completed",
      companiesProcessed: companies.length,
      companiesTotal: companies.length,
      errors,
    };

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    currentSyncProgress = {
      status: "error",
      currentStep: errorMessage,
      companiesProcessed: 0,
      companiesTotal: 0,
      errors,
    };

    const settings = await storage.getConnectwiseSettings();
    if (settings) {
      await storage.updateConnectwiseSettings(settings.id, {
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: "error",
        lastSyncMessage: errorMessage,
      });
    }

    return {
      success: false,
      companiesFound: 0,
      companiesImported: 0,
      companiesUpdated: 0,
      companiesSkipped: 0,
      agreementsProcessed: 0,
      toolsActivated: 0,
      errors,
      duration: Date.now() - startTime,
    };
  }
}
