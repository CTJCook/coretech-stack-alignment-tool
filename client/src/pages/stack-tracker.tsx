import * as React from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCopy,
  Download,
  FileText,
  Layers,
  Plus,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type Role = "admin" | "tech";

type Tool = {
  id: string;
  name: string;
  vendor?: string;
  categoryId: string;
  tags?: string[];
};

type Category = {
  id: string;
  name: string;
  description: string;
};

type BaselineTemplate = {
  id: string;
  name: string;
  description: string;
  requiredToolIds: string[];
  optionalUpsellToolIds: string[];
};

type Customer = {
  id: string;
  name: string;
  type: "SMB" | "Compliance" | "Co-Managed" | "MSP";
  currentToolIds: string[];
  baselineId: string;
};

const categories: Category[] = [
  { id: "rmm", name: "RMM", description: "Monitoring, patching, remote control" },
  { id: "psa", name: "PSA", description: "Tickets, billing, agreements" },
  { id: "deploy", name: "Deployment", description: "Provisioning, onboarding, automation" },
  { id: "mdm", name: "MDM", description: "Mobile/device management" },
  { id: "m365", name: "Microsoft 365", description: "Identity + productivity" },
  { id: "iam", name: "Identity & MFA", description: "SSO, conditional access, MFA" },
  { id: "endpoint", name: "Endpoint Security", description: "EDR, hardening, privilege" },
  { id: "email", name: "Email Security", description: "Filtering, phishing protection" },
  { id: "web", name: "Web Filtering", description: "DNS/agent web filtering" },
  { id: "backup", name: "Backup", description: "Server/workstation + SaaS backup" },
  { id: "network", name: "Network", description: "Firewall, Wi‑Fi, monitoring" },
  { id: "monitoring", name: "Monitoring", description: "Cloud/network/asset visibility" },
  { id: "docs", name: "Documentation", description: "Passwords, runbooks" },
  { id: "siem", name: "SIEM", description: "Log collection + alerting" },
  { id: "sat", name: "Security Awareness", description: "Phishing tests, training" },
  { id: "itdr", name: "ITDR", description: "Identity threat detection" },
];

const toolCatalog: Tool[] = [
  // RMM / PSA
  { id: "ninja", name: "NinjaOne RMM", vendor: "NinjaOne", categoryId: "rmm", tags: ["rmm"] },
  { id: "datto_rmm", name: "Datto RMM", vendor: "Kaseya", categoryId: "rmm" },

  { id: "cw_manage", name: "Manage", vendor: "ConnectWise", categoryId: "psa" },

  // Deployment
  { id: "immybot", name: "ImmyBot", vendor: "ImmyBot", categoryId: "deploy" },

  // Microsoft 365 / Identity
  { id: "m365_bp", name: "Microsoft 365 Business Premium", vendor: "Microsoft", categoryId: "m365" },
  { id: "google_workspace", name: "Google Workspace", vendor: "Google", categoryId: "m365" },

  { id: "entra_p2", name: "Microsoft Entra ID P2", vendor: "Microsoft", categoryId: "iam" },
  { id: "entra", name: "Entra ID P1", vendor: "Microsoft", categoryId: "iam" },
  { id: "duo", name: "Duo MFA", vendor: "Cisco", categoryId: "iam" },

  // Device management
  { id: "addigy", name: "Addigy (Mac Management)", vendor: "Addigy", categoryId: "mdm" },
  { id: "ninja_mdm", name: "NinjaOne MDM", vendor: "NinjaOne", categoryId: "mdm" },
  { id: "intune", name: "Microsoft Intune", vendor: "Microsoft", categoryId: "mdm" },

  // Endpoint security
  { id: "defender_endpoint", name: "Microsoft Defender for Endpoint", vendor: "Microsoft", categoryId: "endpoint" },
  { id: "sentinelone", name: "SentinelOne", vendor: "SentinelOne", categoryId: "endpoint" },
  { id: "huntress_edr", name: "Huntress EDR", vendor: "Huntress", categoryId: "endpoint" },

  // Email security
  { id: "defender_exchange", name: "Microsoft Defender for Exchange", vendor: "Microsoft", categoryId: "email" },
  { id: "abnormal", name: "Abnormal", vendor: "Abnormal", categoryId: "email" },
  { id: "mimecast", name: "Mimecast", vendor: "Mimecast", categoryId: "email" },

  // Web filtering
  { id: "zorus", name: "Zorus Web Filtering", vendor: "Zorus", categoryId: "web" },

  // Backup
  { id: "dropsuite", name: "Dropsuite Backup", vendor: "Dropsuite", categoryId: "backup" },
  { id: "axcient", name: "Axcient Backup", vendor: "Axcient", categoryId: "backup" },
  { id: "datto_backup", name: "Datto Backup", vendor: "Kaseya", categoryId: "backup" },
  { id: "veeam", name: "Veeam", vendor: "Veeam", categoryId: "backup" },
  { id: "afi", name: "AFI.ai", vendor: "AFI.ai", categoryId: "backup" },

  // Network
  { id: "fortigate", name: "FortiGate Firewall", vendor: "Fortinet", categoryId: "network" },
  { id: "fortinet", name: "Fortinet", vendor: "Fortinet", categoryId: "network" },
  { id: "ubiquiti", name: "Ubiquiti / UniFi", vendor: "Ubiquiti", categoryId: "network" },
  { id: "aruba_instant_on", name: "Aruba Instant On", vendor: "HPE Aruba", categoryId: "network" },
  { id: "meraki", name: "Meraki Firewall", vendor: "Cisco", categoryId: "network" },

  // Monitoring / Visibility
  { id: "havoc", name: "Havoc Network Monitoring", vendor: "Havoc", categoryId: "monitoring" },
  { id: "liongard", name: "Liongard", vendor: "Liongard", categoryId: "monitoring" },

  // Documentation / Credentials / Privilege
  { id: "hudu", name: "HUDU", vendor: "Hudu", categoryId: "docs" },
  { id: "passwordboss", name: "CyberFox PasswordBoss", vendor: "CyberFox", categoryId: "docs" },
  { id: "itglue", name: "IT Glue", vendor: "Kaseya", categoryId: "docs" },
  { id: "autoelevate", name: "CyberFox AutoElevate", vendor: "CyberFox", categoryId: "endpoint" },

  // SIEM / Awareness / ITDR
  { id: "huntress_siem", name: "Huntress SIEM", vendor: "Huntress", categoryId: "siem" },
  { id: "blumira", name: "Blumira", vendor: "Blumira", categoryId: "siem" },
  { id: "sentinel", name: "Microsoft Sentinel", vendor: "Microsoft", categoryId: "siem" },

  { id: "huntress_sat", name: "Huntress SAT", vendor: "Huntress", categoryId: "sat" },
  { id: "huntress_itdr", name: "Huntress ITDR", vendor: "Huntress", categoryId: "itdr" },

  // Other\n  { id: "cip_registered", name: "Registered in CIP", vendor: "(internal) ", categoryId: "docs" },
  { id: "cipp", name: "CIPP (Microsoft Tenant Management)", vendor: "CIPP", categoryId: "m365" },
];

const baselines: BaselineTemplate[] = [
  {
    id: "msp_baseline",
    name: "MSP Baseline (Modern M365 + Huntress)",
    description: "Baseline aligned to a modern MSP stack: RMM + deployment, M365 identity, endpoint + email protections, backups, and visibility.",
    requiredToolIds: [
      "hudu",
      "ninja",
      "immybot",
      "cipp",
      "m365_bp",
      "entra_p2",
      "defender_endpoint",
      "defender_exchange",
      "autoelevate",
      "passwordboss",
      "zorus",
      "dropsuite",
      "axcient",
      "datto_backup",
      "havoc",
      "liongard",
      "ubiquiti",
      "aruba_instant_on",
      "fortigate",
      "duo",
      "addigy",
      "ninja_mdm",
      "intune",
      "huntress_edr",
      "huntress_siem",
      "huntress_sat",
      "huntress_itdr",
      "cip_registered"
    ],
    optionalUpsellToolIds: ["sentinel", "blumira"],
  },
  {
    id: "smb_standard",
    name: "SMB Standard",
    description: "A pragmatic baseline for small-to-mid businesses.",
    requiredToolIds: ["ninja", "huntress_edr", "afi", "m365_bp", "abnormal", "hudu"],
    optionalUpsellToolIds: ["blumira", "intune", "meraki"],
  },
  {
    id: "compliance_plus",
    name: "Compliance+",
    description: "Stronger controls + visibility for regulated clients.",
    requiredToolIds: ["ninja", "sentinelone", "veeam", "m365_bp", "hudu", "blumira"],
    optionalUpsellToolIds: ["sentinel", "intune", "fortinet"],
  },
  {
    id: "co_managed",
    name: "Co‑Managed IT",
    description: "A shared-responsibility baseline aligned to internal IT teams.",
    requiredToolIds: ["cw_manage", "huntress_edr", "afi", "entra", "mimecast", "itglue"],
    optionalUpsellToolIds: ["blumira", "jamf", "ubiquiti"],
  },
];

const seedCustomers: Customer[] = [
  {
    id: "c-msp-internal",
    name: "MSP Internal Stack",
    type: "MSP",
    currentToolIds: [
      "hudu",
      "ninja",
      "immybot",
      "cip_registered",
      "cipp",
      "m365_bp",
      "entra_p2",
      "defender_endpoint",
      "defender_exchange",
      "autoelevate",
      "passwordboss",
      "zorus",
      "huntress_edr",
      "huntress_siem",
      "huntress_sat",
      "huntress_itdr",
      "google_workspace",
      "dropsuite",
      "axcient",
      "datto_backup",
      "havoc",
      "liongard",
      "ubiquiti",
      "aruba_instant_on",
      "fortigate",
      "duo",
      "addigy",
      "ninja_mdm",
      "intune"
    ],
    baselineId: "msp_baseline",
  },
  {
    id: "c-northpeak",
    name: "NorthPeak Legal",
    type: "Compliance",
    currentToolIds: ["datto_rmm", "sentinelone", "veeam", "m365_bp"],
    baselineId: "compliance_plus",
  },
  {
    id: "c-archstone",
    name: "Archstone Retail (Co‑Managed)",
    type: "Co-Managed",
    currentToolIds: ["cw_manage", "huntress_edr", "entra", "mimecast"],
    baselineId: "co_managed",
  },
];

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function toolById(id: string) {
  return toolCatalog.find((t) => t.id === id);
}

function toolsByCategoryId(categoryId: string) {
  return toolCatalog.filter((t) => t.categoryId === categoryId);
}

function formatPct(value: number) {
  return `${Math.round(value)}%`;
}

function computeCoverage(currentToolIds: string[], requiredToolIds: string[]) {
  const required = uniq(requiredToolIds);
  const current = new Set(currentToolIds);
  const covered = required.filter((id) => current.has(id)).length;
  const total = required.length;
  const pct = total === 0 ? 100 : (covered / total) * 100;
  return { covered, total, pct };
}

function computeCategoryCoverage(currentToolIds: string[], requiredToolIds: string[]) {
  const current = new Set(currentToolIds);
  const requiredTools = requiredToolIds.map(toolById).filter(Boolean) as Tool[];

  const map = new Map<string, { covered: number; total: number }>();
  for (const t of requiredTools) {
    const entry = map.get(t.categoryId) ?? { covered: 0, total: 0 };
    entry.total += 1;
    if (current.has(t.id)) entry.covered += 1;
    map.set(t.categoryId, entry);
  }

  return categories
    .map((c) => {
      const v = map.get(c.id) ?? { covered: 0, total: 0 };
      const pct = v.total === 0 ? 100 : (v.covered / v.total) * 100;
      return { category: c, ...v, pct };
    })
    .filter((row) => row.total > 0);
}

function diffMissing(currentToolIds: string[], requiredToolIds: string[]) {
  const current = new Set(currentToolIds);
  return uniq(requiredToolIds).filter((id) => !current.has(id));
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Pill({
  tone,
  children,
  testId,
}: {
  tone: "good" | "warn" | "neutral";
  children: React.ReactNode;
  testId: string;
}) {
  const cls =
    tone === "good"
      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
      : tone === "warn"
        ? "bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/25"
        : "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20";

  return (
    <span
      data-testid={testId}
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[12px] leading-none",
        cls,
      )}
    >
      {children}
    </span>
  );
}

function ScoreRing({ value, testId }: { value: number; testId: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 85
      ? "from-emerald-500 to-teal-400"
      : pct >= 60
        ? "from-sky-500 to-indigo-400"
        : "from-amber-500 to-rose-500";

  return (
    <div
      data-testid={testId}
      className="relative grid size-20 place-items-center rounded-full bg-white/70 dark:bg-white/5"
      style={{
        boxShadow: "var(--shadow)",
      }}
    >
      <div
        className={cx(
          "absolute inset-0 rounded-full",
          "bg-[conic-gradient(from_180deg,var(--tw-gradient-stops))]",
          color,
        )}
        style={{
          maskImage:
            "radial-gradient(circle at center, transparent 55%, black 56%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, transparent 55%, black 56%)",
          opacity: 0.92,
        }}
      />
      <div className="relative text-center">
        <div className="font-serif text-2xl tracking-tight">
          {formatPct(pct)}
        </div>
        <div className="text-[11px] text-muted-foreground">Aligned</div>
      </div>
    </div>
  );
}

function buildGapReportText(opts: {
  customer: Customer;
  baseline: BaselineTemplate;
  missingToolIds: string[];
  categoryCoverage: ReturnType<typeof computeCategoryCoverage>;
  coverage: ReturnType<typeof computeCoverage>;
  upsellToolIds: string[];
}) {
  const { customer, baseline, missingToolIds, categoryCoverage, coverage, upsellToolIds } = opts;

  const lines: string[] = [];
  lines.push(`CoreTech Stack Alignment Tool — Gap Report`);
  lines.push(`Customer: ${customer.name}`);
  lines.push(`Baseline: ${baseline.name}`);
  lines.push(`Coverage: ${Math.round(coverage.pct)}% (${coverage.covered}/${coverage.total})`);
  lines.push("");
  lines.push("Missing tools:");
  if (missingToolIds.length === 0) {
    lines.push("- None (fully aligned)");
  } else {
    for (const id of missingToolIds) {
      const t = toolById(id);
      lines.push(`- ${t?.name ?? id}`);
    }
  }

  lines.push("");
  lines.push("Category coverage:");
  for (const row of categoryCoverage) {
    lines.push(`- ${row.category.name}: ${Math.round(row.pct)}% (${row.covered}/${row.total})`);
  }

  lines.push("");
  lines.push("Optional recommendations:");
  if (upsellToolIds.length === 0) {
    lines.push("- None");
  } else {
    for (const id of upsellToolIds) {
      const t = toolById(id);
      lines.push(`- ${t?.name ?? id}`);
    }
  }

  return lines.join("\n");
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function StackTracker() {
  const { toast } = useToast();

  const [role, setRole] = React.useState<Role>("admin");

  const [customers, setCustomers] = React.useState<Customer[]>(seedCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>(seedCustomers[0].id);
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? customers[0];

  const [customerSearch, setCustomerSearch] = React.useState("");

  const [newCustomerName, setNewCustomerName] = React.useState("");
  const [newCustomerType, setNewCustomerType] = React.useState<Customer["type"]>("SMB");

  const isAdmin = role === "admin";

  const baseline = baselines.find((b) => b.id === selectedCustomer.baselineId) ?? baselines[0];

  const requiredToolIds = baseline.requiredToolIds;
  const missingToolIds = diffMissing(selectedCustomer.currentToolIds, requiredToolIds);
  const coverage = computeCoverage(selectedCustomer.currentToolIds, requiredToolIds);
  const categoryCoverage = computeCategoryCoverage(selectedCustomer.currentToolIds, requiredToolIds);

  const recommendedUpsellToolIds = baseline.optionalUpsellToolIds.filter(
    (id) => !selectedCustomer.currentToolIds.includes(id),
  );

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.trim().toLowerCase()),
  );

  function updateSelectedCustomer(patch: Partial<Customer>) {
    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedCustomer.id ? { ...c, ...patch } : c)),
    );
  }

  function toggleTool(toolId: string, checked: boolean) {
    if (!isAdmin) return;
    const set = new Set(selectedCustomer.currentToolIds);
    if (checked) set.add(toolId);
    else set.delete(toolId);
    updateSelectedCustomer({ currentToolIds: Array.from(set) });
  }

  function createCustomer() {
    if (!newCustomerName.trim()) {
      toast({
        title: "Customer name required",
        description: "Add a name to create the customer.",
      });
      return;
    }

    const id = `c-${newCustomerName.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(16)}`;
    const baselineId =
      newCustomerType === "Compliance"
        ? "compliance_plus"
        : newCustomerType === "Co-Managed"
          ? "co_managed"
          : newCustomerType === "MSP"
            ? "msp_baseline"
            : "smb_standard";

    const customer: Customer = {
      id,
      name: newCustomerName.trim(),
      type: newCustomerType,
      currentToolIds: [],
      baselineId,
    };

    setCustomers((prev) => [customer, ...prev]);
    setSelectedCustomerId(customer.id);
    setNewCustomerName("");
    setNewCustomerType("SMB");
    toast({ title: "Customer created", description: `Added ${customer.name}.` });
  }

  function copyGapReport() {
    const text = buildGapReportText({
      customer: selectedCustomer,
      baseline,
      missingToolIds,
      categoryCoverage,
      coverage,
      upsellToolIds: recommendedUpsellToolIds,
    });

    navigator.clipboard
      .writeText(text)
      .then(() => toast({ title: "Copied", description: "Gap report copied to clipboard." }))
      .catch(() =>
        toast({
          title: "Couldn’t copy",
          description: "Your browser blocked clipboard access.",
          variant: "destructive",
        }),
      );
  }

  function exportGapReport() {
    const date = new Date();
    const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;

    const text = buildGapReportText({
      customer: selectedCustomer,
      baseline,
      missingToolIds,
      categoryCoverage,
      coverage,
      upsellToolIds: recommendedUpsellToolIds,
    });

    downloadTextFile(`stack-tracker_gap-report_${selectedCustomer.name.replace(/\s+/g, "-")}_${stamp}.txt`, text);

    toast({ title: "Exported", description: "Downloaded a text gap report." });
  }

  const headerSubtitle =
    "Track each customer’s current stack against a baseline, then generate an actionable gap report.";

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border bg-white/70 p-6 shadow-md backdrop-blur dark:bg-white/5">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-24 -top-24 size-72 rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-500/0 blur-2xl" />
            <div className="absolute -right-20 -top-10 size-80 rounded-full bg-gradient-to-br from-violet-500/18 to-fuchsia-500/0 blur-2xl" />
          </div>

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-white/60 px-3 py-1 text-xs text-muted-foreground shadow-sm dark:bg-white/5">
                  <Sparkles className="h-4 w-4" />
                  <span data-testid="text-product-kicker">MSP Tooling Alignment</span>
                </div>

                <h1
                  data-testid="text-app-title"
                  className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl"
                >
                  CoreTech Stack Alignment Tool
                </h1>
                <p data-testid="text-app-subtitle" className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {headerSubtitle}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded-2xl border bg-white/60 p-2 shadow-sm dark:bg-white/5">
                  <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600/18 to-violet-600/10">
                    <Shield className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="min-w-44">
                    <div className="text-xs text-muted-foreground">Access level</div>
                    <div className="mt-0.5">
                      <Select
                        value={role}
                        onValueChange={(v) => setRole(v as Role)}
                      >
                        <SelectTrigger
                          data-testid="select-role"
                          className="h-9 rounded-xl"
                        >
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem data-testid="option-role-admin" value="admin">Admin (can edit)</SelectItem>
                          <SelectItem data-testid="option-role-tech" value="tech">Technician (view only)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    data-testid="button-copy-report"
                    variant="secondary"
                    className="h-10 rounded-xl"
                    onClick={copyGapReport}
                  >
                    <ClipboardCopy className="h-4 w-4" />
                    Copy report
                  </Button>

                  <Button
                    data-testid="button-export-report"
                    className="h-10 rounded-xl"
                    onClick={exportGapReport}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
              <div className="space-y-4">
                <Card className="glass noise relative rounded-3xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm font-medium" data-testid="text-customers-title">Customers</div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Select a customer, or create a new one.
                      </div>
                    </div>
                    <Badge variant="secondary" data-testid="badge-customer-count">
                      {customers.length}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <Label data-testid="label-customer-search" className="text-xs text-muted-foreground">
                      Search
                    </Label>
                    <Input
                      data-testid="input-customer-search"
                      placeholder="Type a customer name…"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="mt-1 h-10 rounded-xl"
                    />
                  </div>

                  <div className="mt-4 grid gap-2">
                    <Select
                      value={selectedCustomerId}
                      onValueChange={(v) => setSelectedCustomerId(v)}
                    >
                      <SelectTrigger data-testid="select-customer" className="h-11 rounded-xl">
                        <SelectValue placeholder="Choose customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCustomers.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground" data-testid="text-no-customers">
                            No matches.
                          </div>
                        ) : (
                          filteredCustomers.map((c) => (
                            <SelectItem
                              key={c.id}
                              value={c.id}
                              data-testid={`option-customer-${c.id}`}
                            >
                              {c.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    <div className="rounded-2xl border bg-white/50 p-3 text-sm shadow-sm dark:bg-white/5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium" data-testid="text-selected-customer-name">
                            {selectedCustomer.name}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground" data-testid="text-selected-customer-type">
                            {selectedCustomer.type} customer
                          </div>
                        </div>
                        <ScoreRing value={coverage.pct} testId="score-coverage" />
                      </div>

                      <Separator className="my-3" />

                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground" data-testid="text-required-tools-label">
                            Required tools
                          </span>
                          <span className="text-xs font-medium" data-testid="text-required-tools-value">
                            {coverage.covered}/{coverage.total}
                          </span>
                        </div>
                        <Progress value={coverage.pct} data-testid="progress-coverage" />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground" data-testid="text-gaps-label">
                            Gaps
                          </span>
                          <span className="text-xs font-medium" data-testid="text-gaps-value">
                            {missingToolIds.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="glass noise relative rounded-3xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm font-medium" data-testid="text-create-customer-title">Create customer</div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Quickly start a new assessment.
                      </div>
                    </div>
                    {!isAdmin ? (
                      <Pill tone="neutral" testId="pill-view-only">
                        View only
                      </Pill>
                    ) : (
                      <Pill tone="good" testId="pill-admin">
                        Admin
                      </Pill>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div>
                      <Label data-testid="label-new-customer-name" className="text-xs text-muted-foreground">
                        Customer name
                      </Label>
                      <Input
                        data-testid="input-new-customer-name"
                        placeholder="e.g., Alpine Dental"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        className="mt-1 h-10 rounded-xl"
                        disabled={!isAdmin}
                      />
                    </div>

                    <div>
                      <Label data-testid="label-new-customer-type" className="text-xs text-muted-foreground">
                        Customer type
                      </Label>
                      <Select
                        value={newCustomerType}
                        onValueChange={(v) => setNewCustomerType(v as Customer["type"])}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger data-testid="select-new-customer-type" className="mt-1 h-10 rounded-xl">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem data-testid="option-type-smb" value="SMB">SMB</SelectItem>
                          <SelectItem data-testid="option-type-compliance" value="Compliance">Compliance</SelectItem>
                          <SelectItem data-testid="option-type-comanaged" value="Co-Managed">Co‑Managed</SelectItem>
                          <SelectItem data-testid="option-type-msp" value="MSP">MSP (internal)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      data-testid="button-create-customer"
                      className="h-10 rounded-xl"
                      onClick={createCustomer}
                      disabled={!isAdmin}
                    >
                      Create
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>

                <Card className="glass noise relative rounded-3xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm font-medium" data-testid="text-baseline-title">Baseline stack</div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Choose the recommended template.
                      </div>
                    </div>
                    <Pill tone="neutral" testId="pill-baseline-id">
                      {baseline.id}
                    </Pill>
                  </div>

                  <div className="mt-4">
                    <Select
                      value={baseline.id}
                      onValueChange={(v) => updateSelectedCustomer({ baselineId: v })}
                      disabled={!isAdmin}
                    >
                      <SelectTrigger data-testid="select-baseline" className="h-11 rounded-xl">
                        <SelectValue placeholder="Choose baseline" />
                      </SelectTrigger>
                      <SelectContent>
                        {baselines.map((b) => (
                          <SelectItem key={b.id} value={b.id} data-testid={`option-baseline-${b.id}`}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="mt-3 rounded-2xl border bg-white/55 p-3 text-sm shadow-sm dark:bg-white/5">
                      <div className="font-medium" data-testid="text-baseline-name">
                        {baseline.name}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground" data-testid="text-baseline-description">
                        {baseline.description}
                      </div>
                      <Separator className="my-3" />
                      <div className="grid gap-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground" data-testid="text-baseline-required-label">Required</span>
                          <span className="font-medium" data-testid="text-baseline-required-value">{baseline.requiredToolIds.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground" data-testid="text-baseline-upsell-label">Optional</span>
                          <span className="font-medium" data-testid="text-baseline-upsell-value">{baseline.optionalUpsellToolIds.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <Card className="glass noise relative rounded-3xl p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm font-medium" data-testid="text-gap-report-title">
                            Gap report
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground" data-testid="text-gap-report-subtitle">
                          What’s missing compared to {baseline.name}. Ready to copy/export.
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {missingToolIds.length === 0 ? (
                          <Pill tone="good" testId="pill-fully-aligned">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Fully aligned
                          </Pill>
                        ) : (
                          <Pill tone="warn" testId="pill-has-gaps">
                            {missingToolIds.length} gap{missingToolIds.length === 1 ? "" : "s"}
                          </Pill>
                        )}
                        <Pill tone="neutral" testId="pill-customer-type">
                          {selectedCustomer.type}
                        </Pill>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_340px]">
                      <div className="rounded-3xl border bg-white/55 p-4 shadow-sm dark:bg-white/5">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium" data-testid="text-missing-tools-title">Missing tools</div>
                          <Badge variant="secondary" data-testid="badge-missing-count">
                            {missingToolIds.length}
                          </Badge>
                        </div>

                        <div className="mt-3 grid gap-2">
                          {missingToolIds.length === 0 ? (
                            <div className="text-sm text-muted-foreground" data-testid="text-no-gaps">
                              No missing tools — this customer is aligned to the baseline.
                            </div>
                          ) : (
                            missingToolIds.map((id) => {
                              const t = toolById(id);
                              const cat = categories.find((c) => c.id === t?.categoryId);
                              return (
                                <div
                                  key={id}
                                  data-testid={`row-missing-${id}`}
                                  className="flex items-center justify-between rounded-2xl border bg-white/60 px-3 py-2 shadow-sm dark:bg-white/5"
                                >
                                  <div>
                                    <div className="text-sm font-medium" data-testid={`text-missing-name-${id}`}>
                                      {t?.name ?? id}
                                    </div>
                                    <div className="text-xs text-muted-foreground" data-testid={`text-missing-meta-${id}`}>
                                      {cat?.name ?? "Category"} • {t?.vendor ?? "Vendor"}
                                    </div>
                                  </div>
                                  <Badge variant="secondary" data-testid={`badge-missing-cat-${id}`}>
                                    {cat?.name ?? "Tool"}
                                  </Badge>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="rounded-3xl border bg-white/55 p-4 shadow-sm dark:bg-white/5">
                        <div className="text-sm font-medium" data-testid="text-category-coverage-title">
                          Category coverage
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground" data-testid="text-category-coverage-subtitle">
                          Focus next actions where coverage is lowest.
                        </div>

                        <div className="mt-4 grid gap-3">
                          {categoryCoverage.map((row) => (
                            <div key={row.category.id} className="grid gap-2" data-testid={`group-category-${row.category.id}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-medium" data-testid={`text-category-name-${row.category.id}`}>
                                    {row.category.name}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground" data-testid={`text-category-desc-${row.category.id}`}>
                                    {row.category.description}
                                  </div>
                                </div>
                                <div className="text-xs font-medium" data-testid={`text-category-pct-${row.category.id}`}>
                                  {formatPct(row.pct)}
                                </div>
                              </div>
                              <Progress value={row.pct} data-testid={`progress-category-${row.category.id}`} />
                            </div>
                          ))}
                        </div>

                        <Separator className="my-4" />

                        <div className="text-sm font-medium" data-testid="text-upsell-title">
                          Optional recommendations
                        </div>
                        <div className="mt-2 grid gap-2">
                          {recommendedUpsellToolIds.length === 0 ? (
                            <div className="text-sm text-muted-foreground" data-testid="text-no-upsell">
                              Nothing to recommend right now.
                            </div>
                          ) : (
                            recommendedUpsellToolIds.map((id) => {
                              const t = toolById(id);
                              const cat = categories.find((c) => c.id === t?.categoryId);
                              return (
                                <div
                                  key={id}
                                  className="flex items-center justify-between rounded-2xl border bg-white/60 px-3 py-2 shadow-sm dark:bg-white/5"
                                  data-testid={`row-upsell-${id}`}
                                >
                                  <div>
                                    <div className="text-sm font-medium" data-testid={`text-upsell-name-${id}`}>
                                      {t?.name ?? id}
                                    </div>
                                    <div className="text-xs text-muted-foreground" data-testid={`text-upsell-meta-${id}`}>
                                      {cat?.name ?? "Category"} • {t?.vendor ?? "Vendor"}
                                    </div>
                                  </div>
                                  <Badge data-testid={`badge-upsell-${id}`}>
                                    Consider
                                  </Badge>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <Card className="glass noise relative rounded-3xl p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-medium" data-testid="text-stack-editor-title">
                        Current stack (by category)
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground" data-testid="text-stack-editor-subtitle">
                        {isAdmin
                          ? "Check the tools the customer uses today."
                          : "View-only mode. Switch to Admin to edit."}
                      </div>
                    </div>
                    <Pill tone={isAdmin ? "good" : "neutral"} testId="pill-edit-mode">
                      {isAdmin ? "Editable" : "Locked"}
                    </Pill>
                  </div>

                  <Tabs defaultValue={categories[0].id} className="mt-4">
                    <TabsList className="w-full justify-start overflow-x-auto rounded-2xl bg-white/55 p-1 dark:bg-white/5">
                      {categories.map((c) => (
                        <TabsTrigger
                          key={c.id}
                          value={c.id}
                          className="rounded-xl"
                          data-testid={`tab-${c.id}`}
                        >
                          {c.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {categories.map((c) => {
                      const tools = toolsByCategoryId(c.id);
                      return (
                        <TabsContent key={c.id} value={c.id} className="mt-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            {tools.map((t) => {
                              const checked = selectedCustomer.currentToolIds.includes(t.id);
                              const required = baseline.requiredToolIds.includes(t.id);
                              const inUpsell = baseline.optionalUpsellToolIds.includes(t.id);

                              return (
                                <div
                                  key={t.id}
                                  className={cx(
                                    "flex items-start justify-between gap-3 rounded-3xl border bg-white/60 p-4 shadow-sm transition",
                                    "hover:translate-y-[-1px] hover:shadow-md",
                                    "dark:bg-white/5",
                                  )}
                                  data-testid={`card-tool-${t.id}`}
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div className="truncate text-sm font-medium" data-testid={`text-tool-name-${t.id}`}>
                                        {t.name}
                                      </div>
                                      {required ? (
                                        <Badge variant="secondary" data-testid={`badge-required-${t.id}`}>
                                          Required
                                        </Badge>
                                      ) : inUpsell ? (
                                        <Badge data-testid={`badge-optional-${t.id}`}>Optional</Badge>
                                      ) : null}
                                    </div>
                                    <div className="mt-1 truncate text-xs text-muted-foreground" data-testid={`text-tool-meta-${t.id}`}>
                                      {t.vendor ?? "Vendor"}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="text-xs text-muted-foreground" data-testid={`text-tool-status-${t.id}`}>
                                      {checked ? "In use" : "Not used"}
                                    </div>
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(v) => toggleTool(t.id, Boolean(v))}
                                      disabled={!isAdmin}
                                      data-testid={`checkbox-tool-${t.id}`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </Card>

                <Card className="glass noise relative rounded-3xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium" data-testid="text-matrix-title">
                        Baseline vs current (matrix)
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground" data-testid="text-matrix-subtitle">
                        Quick view for meetings.
                      </div>
                    </div>
                    <Badge variant="secondary" data-testid="badge-matrix-total">
                      {baseline.requiredToolIds.length} required
                    </Badge>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-2xl border bg-white/55 dark:bg-white/5">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Tool</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {baseline.requiredToolIds.map((id) => {
                          const t = toolById(id);
                          const cat = categories.find((c) => c.id === t?.categoryId);
                          const has = selectedCustomer.currentToolIds.includes(id);

                          return (
                            <TableRow key={id} data-testid={`row-required-${id}`}>
                              <TableCell data-testid={`cell-required-cat-${id}`}>
                                {cat?.name ?? "—"}
                              </TableCell>
                              <TableCell data-testid={`cell-required-tool-${id}`}>
                                {t?.name ?? id}
                              </TableCell>
                              <TableCell data-testid={`cell-required-status-${id}`}>
                                {has ? (
                                  <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="h-4 w-4" />
                                    In place
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 text-amber-800 dark:text-amber-300">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    Missing
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {!isAdmin ? (
                    <div className="mt-3 text-xs text-muted-foreground" data-testid="text-permissions-hint">
                      Editing is disabled for technicians.
                    </div>
                  ) : null}
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground" data-testid="text-footer">
          Prototype: data is stored in-memory for demo purposes.
        </div>
      </div>
    </div>
  );
}
