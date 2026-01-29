import { db } from "./index";
import { categories, tools, baselines } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(baselines);
  await db.delete(tools);
  await db.delete(categories);

  // Seed categories
  const categoryData = [
    { name: "RMM", description: "Remote Monitoring and Management", sortOrder: 1 },
    { name: "PSA", description: "Professional Services Automation", sortOrder: 2 },
    { name: "Deployment", description: "Software Deployment & Patching", sortOrder: 3 },
    { name: "MDM", description: "Mobile Device Management", sortOrder: 4 },
    { name: "IAM", description: "Identity & Access Management", sortOrder: 5 },
    { name: "Endpoint Security", description: "Antivirus & EDR", sortOrder: 6 },
    { name: "Email Security", description: "Email Protection & Filtering", sortOrder: 7 },
    { name: "Web Filtering", description: "DNS & Content Filtering", sortOrder: 8 },
    { name: "Backup & DR", description: "Backup and Disaster Recovery", sortOrder: 9 },
    { name: "Network", description: "Network Management", sortOrder: 10 },
    { name: "Monitoring", description: "Infrastructure Monitoring", sortOrder: 11 },
    { name: "Documentation", description: "IT Documentation", sortOrder: 12 },
    { name: "SIEM", description: "Security Information & Event Management", sortOrder: 13 },
    { name: "Security Awareness", description: "Security Awareness Training", sortOrder: 14 },
    { name: "ITDR", description: "Identity Threat Detection & Response", sortOrder: 15 },
    { name: "Password Management", description: "Password Vaults", sortOrder: 16 },
  ];

  const insertedCategories = await db.insert(categories).values(categoryData).returning();
  const catMap = Object.fromEntries(insertedCategories.map(c => [c.name, c.id]));

  // Seed tools
  const toolsData = [
    // RMM
    { name: "Datto RMM", vendor: "Datto", categoryId: catMap["RMM"], tags: [] },
    { name: "NinjaOne RMM", vendor: "NinjaOne", categoryId: catMap["RMM"], tags: [] },
    { name: "Syncro", vendor: "Syncro", categoryId: catMap["RMM"], tags: [] },
    { name: "Atera", vendor: "Atera", categoryId: catMap["RMM"], tags: [] },
    
    // PSA
    { name: "ConnectWise Manage", vendor: "ConnectWise", categoryId: catMap["PSA"], tags: [] },
    { name: "Syncro PSA", vendor: "Syncro", categoryId: catMap["PSA"], tags: [] },
    { name: "Atera PSA", vendor: "Atera", categoryId: catMap["PSA"], tags: [] },
    
    // Deployment
    { name: "PDQ Deploy", vendor: "PDQ", categoryId: catMap["Deployment"], tags: [] },
    { name: "NinjaOne Patching", vendor: "NinjaOne", categoryId: catMap["Deployment"], tags: [] },
    
    // MDM
    { name: "Addigy", vendor: "Addigy", categoryId: catMap["MDM"], tags: ["Apple"] },
    { name: "Kandji", vendor: "Kandji", categoryId: catMap["MDM"], tags: ["Apple"] },
    { name: "Jamf", vendor: "Jamf", categoryId: catMap["MDM"], tags: ["Apple"] },
    { name: "NinjaOne MDM", vendor: "NinjaOne", categoryId: catMap["MDM"], tags: [] },
    { name: "Intune", vendor: "Microsoft", categoryId: catMap["MDM"], tags: [] },
    
    // IAM
    { name: "Microsoft Entra ID", vendor: "Microsoft", categoryId: catMap["IAM"], tags: [] },
    { name: "JumpCloud", vendor: "JumpCloud", categoryId: catMap["IAM"], tags: [] },
    { name: "Okta", vendor: "Okta", categoryId: catMap["IAM"], tags: [] },
    
    // Endpoint Security
    { name: "SentinelOne", vendor: "SentinelOne", categoryId: catMap["Endpoint Security"], tags: ["EDR"] },
    { name: "CrowdStrike", vendor: "CrowdStrike", categoryId: catMap["Endpoint Security"], tags: ["EDR"] },
    { name: "Huntress", vendor: "Huntress", categoryId: catMap["Endpoint Security"], tags: ["EDR"] },
    { name: "Webroot", vendor: "OpenText", categoryId: catMap["Endpoint Security"], tags: ["AV"] },
    { name: "ESET", vendor: "ESET", categoryId: catMap["Endpoint Security"], tags: ["AV"] },
    
    // Email Security
    { name: "Mailprotector CloudFilter", vendor: "Mailprotector", categoryId: catMap["Email Security"], tags: [] },
    { name: "Mailprotector Bracket", vendor: "Mailprotector", categoryId: catMap["Email Security"], tags: [] },
    { name: "Mailprotector Secure Store", vendor: "Mailprotector", categoryId: catMap["Email Security"], tags: [] },
    { name: "Barracuda", vendor: "Barracuda", categoryId: catMap["Email Security"], tags: [] },
    { name: "Microsoft Defender for Office 365", vendor: "Microsoft", categoryId: catMap["Email Security"], tags: [] },
    
    // Web Filtering
    { name: "DNSFilter", vendor: "DNSFilter", categoryId: catMap["Web Filtering"], tags: [] },
    { name: "Cisco Umbrella", vendor: "Cisco", categoryId: catMap["Web Filtering"], tags: [] },
    { name: "Webroot DNS Protection", vendor: "OpenText", categoryId: catMap["Web Filtering"], tags: [] },
    
    // Backup & DR
    { name: "Datto BCDR", vendor: "Datto", categoryId: catMap["Backup & DR"], tags: [] },
    { name: "Veeam", vendor: "Veeam", categoryId: catMap["Backup & DR"], tags: [] },
    { name: "Acronis", vendor: "Acronis", categoryId: catMap["Backup & DR"], tags: [] },
    { name: "Axcient", vendor: "Axcient", categoryId: catMap["Backup & DR"], tags: [] },
    
    // Network
    { name: "Ubiquiti UniFi", vendor: "Ubiquiti", categoryId: catMap["Network"], tags: [] },
    { name: "Meraki", vendor: "Cisco", categoryId: catMap["Network"], tags: [] },
    { name: "Fortinet", vendor: "Fortinet", categoryId: catMap["Network"], tags: [] },
    
    // Monitoring
    { name: "Datto Networking", vendor: "Datto", categoryId: catMap["Monitoring"], tags: [] },
    { name: "Auvik", vendor: "Auvik", categoryId: catMap["Monitoring"], tags: [] },
    { name: "PRTG", vendor: "Paessler", categoryId: catMap["Monitoring"], tags: [] },
    
    // Documentation
    { name: "IT Glue", vendor: "Kaseya", categoryId: catMap["Documentation"], tags: [] },
    { name: "Hudu", vendor: "Hudu", categoryId: catMap["Documentation"], tags: [] },
    { name: "Confluence", vendor: "Atlassian", categoryId: catMap["Documentation"], tags: [] },
    
    // SIEM
    { name: "Arctic Wolf", vendor: "Arctic Wolf", categoryId: catMap["SIEM"], tags: [] },
    { name: "Huntress MDR", vendor: "Huntress", categoryId: catMap["SIEM"], tags: [] },
    { name: "Blumira", vendor: "Blumira", categoryId: catMap["SIEM"], tags: [] },
    
    // Security Awareness
    { name: "KnowBe4", vendor: "KnowBe4", categoryId: catMap["Security Awareness"], tags: [] },
    { name: "Proofpoint Security Awareness", vendor: "Proofpoint", categoryId: catMap["Security Awareness"], tags: [] },
    
    // ITDR
    { name: "Huntress ITDR", vendor: "Huntress", categoryId: catMap["ITDR"], tags: [] },
    { name: "Semperis", vendor: "Semperis", categoryId: catMap["ITDR"], tags: [] },
    
    // Password Management
    { name: "1Password", vendor: "1Password", categoryId: catMap["Password Management"], tags: [] },
    { name: "Keeper", vendor: "Keeper", categoryId: catMap["Password Management"], tags: [] },
    { name: "Bitwarden", vendor: "Bitwarden", categoryId: catMap["Password Management"], tags: [] },
  ];

  const insertedTools = await db.insert(tools).values(toolsData).returning();
  const toolMap = Object.fromEntries(insertedTools.map(t => [t.name, t.id]));

  // Seed baselines
  const baselinesData = [
    {
      name: "SMB Standard",
      description: "Core stack for small-medium businesses",
      requiredToolIds: [
        toolMap["NinjaOne RMM"],
        toolMap["Microsoft Entra ID"],
        toolMap["SentinelOne"],
        toolMap["Mailprotector CloudFilter"],
        toolMap["DNSFilter"],
        toolMap["Datto BCDR"],
        toolMap["KnowBe4"],
      ],
      optionalToolIds: [
        toolMap["ConnectWise Manage"],
        toolMap["IT Glue"],
        toolMap["Huntress"],
      ],
    },
    {
      name: "Compliance Plus",
      description: "Enhanced stack for compliance-driven organizations",
      requiredToolIds: [
        toolMap["NinjaOne RMM"],
        toolMap["ConnectWise Manage"],
        toolMap["Microsoft Entra ID"],
        toolMap["SentinelOne"],
        toolMap["Mailprotector CloudFilter"],
        toolMap["Mailprotector Bracket"],
        toolMap["DNSFilter"],
        toolMap["Datto BCDR"],
        toolMap["Arctic Wolf"],
        toolMap["KnowBe4"],
        toolMap["IT Glue"],
        toolMap["1Password"],
      ],
      optionalToolIds: [
        toolMap["Huntress ITDR"],
        toolMap["Microsoft Defender for Office 365"],
      ],
    },
    {
      name: "Co-Managed IT",
      description: "Stack for organizations with internal IT teams",
      requiredToolIds: [
        toolMap["NinjaOne RMM"],
        toolMap["Microsoft Entra ID"],
        toolMap["SentinelOne"],
        toolMap["DNSFilter"],
        toolMap["Veeam"],
        toolMap["KnowBe4"],
      ],
      optionalToolIds: [
        toolMap["Intune"],
        toolMap["Confluence"],
        toolMap["PRTG"],
      ],
    },
  ];

  await db.insert(baselines).values(baselinesData).returning();

  console.log("Seed completed successfully!");
  console.log(`- ${insertedCategories.length} categories`);
  console.log(`- ${insertedTools.length} tools`);
  console.log(`- ${baselinesData.length} baselines`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
