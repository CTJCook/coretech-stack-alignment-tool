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
  Settings,
} from "lucide-react";
import { Link } from "wouter";
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
import { useCategories, useTools, useBaselines, useCustomers, useCreateCustomer, useUpdateCustomer } from "@/hooks/use-stack-data";
import type { Category, Tool, Baseline, Customer } from "@shared/schema";

type Role = "admin" | "tech";

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
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

function computeCategoryCoverage(
  currentToolIds: string[],
  requiredToolIds: string[],
  toolCatalog: Tool[],
  categories: Category[]
) {
  const current = new Set(currentToolIds);
  const toolById = (id: string) => toolCatalog.find((t) => t.id === id);
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
  baseline: Baseline;
  missingToolIds: string[];
  categoryCoverage: ReturnType<typeof computeCategoryCoverage>;
  coverage: ReturnType<typeof computeCoverage>;
  upsellToolIds: string[];
  toolCatalog: Tool[];
}) {
  const { customer, baseline, missingToolIds, categoryCoverage, coverage, upsellToolIds, toolCatalog } = opts;
  const toolById = (id: string) => toolCatalog.find((t) => t.id === id);

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

  const categoriesQuery = useCategories();
  const toolsQuery = useTools();
  const baselinesQuery = useBaselines();
  const customersQuery = useCustomers();
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  const [role, setRole] = React.useState<Role>("admin");
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("");
  const [customerSearch, setCustomerSearch] = React.useState("");
  const [newCustomerName, setNewCustomerName] = React.useState("");
  const [newCustomerAddress, setNewCustomerAddress] = React.useState("");
  const [newCustomerPrimaryContact, setNewCustomerPrimaryContact] = React.useState("");
  const [newCustomerPhone, setNewCustomerPhone] = React.useState("");
  const [newCustomerContactPhone, setNewCustomerContactPhone] = React.useState("");
  const [newCustomerContactEmail, setNewCustomerContactEmail] = React.useState("");
  const [newCustomerServiceTiers, setNewCustomerServiceTiers] = React.useState<("Essentials" | "MSP" | "Break-Fix")[]>(["Essentials"]);

  const categories = categoriesQuery.data ?? [];
  const toolCatalog = toolsQuery.data ?? [];
  const baselines = baselinesQuery.data ?? [];
  const customers = customersQuery.data ?? [];

  React.useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const isAdmin = role === "admin";
  const isLoading = categoriesQuery.isLoading || toolsQuery.isLoading || baselinesQuery.isLoading || customersQuery.isLoading;
  const hasError = categoriesQuery.isError || toolsQuery.isError || baselinesQuery.isError || customersQuery.isError;

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? customers[0];
  const baseline = baselines.find((b) => b.id === selectedCustomer?.baselineId) ?? baselines[0];

  const toolById = (id: string) => toolCatalog.find((t) => t.id === id);
  const toolsByCategoryId = (categoryId: string) => toolCatalog.filter((t) => t.categoryId === categoryId);

  const requiredToolIds = baseline?.requiredToolIds ?? [];
  const missingToolIds = selectedCustomer ? diffMissing(selectedCustomer.currentToolIds, requiredToolIds) : [];
  const coverage = selectedCustomer ? computeCoverage(selectedCustomer.currentToolIds, requiredToolIds) : { covered: 0, total: 0, pct: 0 };
  const categoryCoverage = selectedCustomer && baseline
    ? computeCategoryCoverage(selectedCustomer.currentToolIds, requiredToolIds, toolCatalog, categories)
    : [];

  const recommendedUpsellToolIds = baseline && selectedCustomer
    ? baseline.optionalToolIds.filter((id) => !selectedCustomer.currentToolIds.includes(id))
    : [];

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.trim().toLowerCase()),
  );

  function updateSelectedCustomer(patch: Partial<Customer>) {
    if (!selectedCustomer) return;
    updateCustomerMutation.mutate({
      id: selectedCustomer.id,
      data: patch,
    });
  }

  function toggleTool(toolId: string, checked: boolean) {
    if (!isAdmin || !selectedCustomer) return;
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

    if (newCustomerServiceTiers.length === 0) {
      toast({
        title: "Service tier required",
        description: "Select at least one service tier.",
      });
      return;
    }

    const baselineId = baselines.find((b) => {
      if (newCustomerServiceTiers.includes("MSP")) return b.name.includes("MSP") || b.name.includes("Baseline");
      return b.name.includes("Standard") || b.name.includes("SMB");
    })?.id ?? baselines[0]?.id;

    if (!baselineId) {
      toast({
        title: "No baseline available",
        description: "Please create a baseline first.",
        variant: "destructive",
      });
      return;
    }

    createCustomerMutation.mutate(
      {
        name: newCustomerName.trim(),
        address: newCustomerAddress.trim() || null,
        primaryContactName: newCustomerPrimaryContact.trim() || null,
        customerPhone: newCustomerPhone.trim() || null,
        contactPhone: newCustomerContactPhone.trim() || null,
        contactEmail: newCustomerContactEmail.trim() || null,
        serviceTiers: newCustomerServiceTiers,
        currentToolIds: [],
        baselineId,
      },
      {
        onSuccess: (customer) => {
          setSelectedCustomerId(customer.id);
          setNewCustomerName("");
          setNewCustomerAddress("");
          setNewCustomerPrimaryContact("");
          setNewCustomerPhone("");
          setNewCustomerContactPhone("");
          setNewCustomerContactEmail("");
          setNewCustomerServiceTiers(["Essentials"]);
        },
      }
    );
  }

  function copyGapReport() {
    if (!selectedCustomer || !baseline) return;
    const text = buildGapReportText({
      customer: selectedCustomer,
      baseline,
      missingToolIds,
      categoryCoverage,
      coverage,
      upsellToolIds: recommendedUpsellToolIds,
      toolCatalog,
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
    if (!selectedCustomer || !baseline) return;
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
      toolCatalog,
    });

    downloadTextFile(`stack-tracker_gap-report_${selectedCustomer.name.replace(/\s+/g, "-")}_${stamp}.txt`, text);

    toast({ title: "Exported", description: "Downloaded a text gap report." });
  }

  const headerSubtitle =
    "Track each customer’s current stack against a baseline, then generate an actionable gap report.";


  if (isLoading) {
    return (
      <div className="app-shell">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="text-lg font-medium">Loading stack data...</div>
              <div className="mt-2 text-sm text-muted-foreground">Please wait while we fetch your data</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="app-shell">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="text-lg font-medium text-destructive">Error loading data</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {categoriesQuery.error?.message || toolsQuery.error?.message || baselinesQuery.error?.message || customersQuery.error?.message || "An error occurred"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedCustomer) {
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
                    <span>MSP Tooling Alignment</span>
                  </div>
                  <h1 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
                    CoreTech Stack Alignment Tool
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Track each customer's current stack against a baseline, then generate an actionable gap report.
                  </p>
                </div>
                <Link href="/admin">
                  <Button variant="outline" className="rounded-xl" data-testid="button-admin-portal-empty">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Portal
                  </Button>
                </Link>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="glass noise relative rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div className="text-lg font-medium">Getting Started</div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    No customers have been added yet. Create your first customer using the form on the right to begin tracking their software stack against recommended baselines.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-2">Quick tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Add customer details including contact info</li>
                      <li>Select service tiers that apply (Essentials, MSP, Break-Fix)</li>
                      <li>Use the Admin Portal to manage categories, tools, and baselines</li>
                    </ul>
                  </div>
                </Card>

                <Card className="glass noise relative rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <div className="text-lg font-medium">Create Your First Customer</div>
                  </div>

                  <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Customer name *</Label>
                      <Input
                        data-testid="input-first-customer-name"
                        placeholder="e.g., Alpine Dental"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        className="mt-1 h-10 rounded-xl"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Address</Label>
                      <Input
                        data-testid="input-first-customer-address"
                        placeholder="e.g., 123 Main St, City, ST 12345"
                        value={newCustomerAddress}
                        onChange={(e) => setNewCustomerAddress(e.target.value)}
                        className="mt-1 h-10 rounded-xl"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Primary contact name</Label>
                      <Input
                        data-testid="input-first-customer-primary-contact"
                        placeholder="e.g., John Smith"
                        value={newCustomerPrimaryContact}
                        onChange={(e) => setNewCustomerPrimaryContact(e.target.value)}
                        className="mt-1 h-10 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Customer phone</Label>
                        <Input
                          data-testid="input-first-customer-phone"
                          placeholder="(555) 123-4567"
                          value={newCustomerPhone}
                          onChange={(e) => setNewCustomerPhone(e.target.value)}
                          className="mt-1 h-10 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Contact phone</Label>
                        <Input
                          data-testid="input-first-customer-contact-phone"
                          placeholder="(555) 987-6543"
                          value={newCustomerContactPhone}
                          onChange={(e) => setNewCustomerContactPhone(e.target.value)}
                          className="mt-1 h-10 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Contact email</Label>
                      <Input
                        data-testid="input-first-customer-contact-email"
                        placeholder="e.g., john@example.com"
                        value={newCustomerContactEmail}
                        onChange={(e) => setNewCustomerContactEmail(e.target.value)}
                        className="mt-1 h-10 rounded-xl"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Service tiers * (select all that apply)</Label>
                      <div className="mt-2 grid gap-2">
                        {(["Essentials", "MSP", "Break-Fix"] as const).map((tier) => (
                          <div key={tier} className="flex items-center gap-2">
                            <Checkbox
                              id={`first-tier-${tier}`}
                              data-testid={`checkbox-first-tier-${tier}`}
                              checked={newCustomerServiceTiers.includes(tier)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewCustomerServiceTiers([...newCustomerServiceTiers, tier]);
                                } else {
                                  setNewCustomerServiceTiers(newCustomerServiceTiers.filter((t) => t !== tier));
                                }
                              }}
                            />
                            <Label htmlFor={`first-tier-${tier}`} className="text-sm">{tier}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      data-testid="button-create-first-customer"
                      className="h-10 rounded-xl"
                      onClick={createCustomer}
                    >
                      Create Customer
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
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
                <Link href="/admin">
                  <Button variant="outline" className="rounded-xl" data-testid="button-admin-portal">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Portal
                  </Button>
                </Link>
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
                          <div className="mt-0.5 text-xs text-muted-foreground" data-testid="text-selected-customer-tiers">
                            {selectedCustomer.serviceTiers?.length > 0 ? selectedCustomer.serviceTiers.join(", ") : "No tiers"} 
                          </div>
                        </div>
                        <ScoreRing value={coverage.pct} testId="score-coverage" />
                      </div>

                      {(selectedCustomer.address || selectedCustomer.primaryContactName || selectedCustomer.contactEmail) && (
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {selectedCustomer.address && (
                            <div data-testid="text-selected-customer-address">{selectedCustomer.address}</div>
                          )}
                          {selectedCustomer.primaryContactName && (
                            <div data-testid="text-selected-customer-contact">
                              {selectedCustomer.primaryContactName}
                              {selectedCustomer.contactPhone && ` • ${selectedCustomer.contactPhone}`}
                            </div>
                          )}
                          {selectedCustomer.contactEmail && (
                            <div data-testid="text-selected-customer-email">{selectedCustomer.contactEmail}</div>
                          )}
                          {selectedCustomer.customerPhone && !selectedCustomer.primaryContactName && (
                            <div data-testid="text-selected-customer-phone">{selectedCustomer.customerPhone}</div>
                          )}
                        </div>
                      )}

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

                  <div className="mt-4 grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                    <div>
                      <Label data-testid="label-new-customer-name" className="text-xs text-muted-foreground">
                        Customer name *
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
                      <Label data-testid="label-new-customer-address" className="text-xs text-muted-foreground">
                        Address
                      </Label>
                      <Input
                        data-testid="input-new-customer-address"
                        placeholder="e.g., 123 Main St, City, ST 12345"
                        value={newCustomerAddress}
                        onChange={(e) => setNewCustomerAddress(e.target.value)}
                        className="mt-1 h-10 rounded-xl"
                        disabled={!isAdmin}
                      />
                    </div>

                    <div>
                      <Label data-testid="label-new-customer-primary-contact" className="text-xs text-muted-foreground">
                        Primary contact name
                      </Label>
                      <Input
                        data-testid="input-new-customer-primary-contact"
                        placeholder="e.g., John Smith"
                        value={newCustomerPrimaryContact}
                        onChange={(e) => setNewCustomerPrimaryContact(e.target.value)}
                        className="mt-1 h-10 rounded-xl"
                        disabled={!isAdmin}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label data-testid="label-new-customer-phone" className="text-xs text-muted-foreground">
                          Customer phone
                        </Label>
                        <Input
                          data-testid="input-new-customer-phone"
                          placeholder="(555) 123-4567"
                          value={newCustomerPhone}
                          onChange={(e) => setNewCustomerPhone(e.target.value)}
                          className="mt-1 h-10 rounded-xl"
                          disabled={!isAdmin}
                        />
                      </div>
                      <div>
                        <Label data-testid="label-new-customer-contact-phone" className="text-xs text-muted-foreground">
                          Contact phone
                        </Label>
                        <Input
                          data-testid="input-new-customer-contact-phone"
                          placeholder="(555) 987-6543"
                          value={newCustomerContactPhone}
                          onChange={(e) => setNewCustomerContactPhone(e.target.value)}
                          className="mt-1 h-10 rounded-xl"
                          disabled={!isAdmin}
                        />
                      </div>
                    </div>

                    <div>
                      <Label data-testid="label-new-customer-contact-email" className="text-xs text-muted-foreground">
                        Contact email
                      </Label>
                      <Input
                        data-testid="input-new-customer-contact-email"
                        placeholder="e.g., john@example.com"
                        value={newCustomerContactEmail}
                        onChange={(e) => setNewCustomerContactEmail(e.target.value)}
                        className="mt-1 h-10 rounded-xl"
                        disabled={!isAdmin}
                      />
                    </div>

                    <div>
                      <Label data-testid="label-new-customer-tiers" className="text-xs text-muted-foreground">
                        Service tiers * (select all that apply)
                      </Label>
                      <div className="mt-2 grid gap-2">
                        {(["Essentials", "MSP", "Break-Fix"] as const).map((tier) => (
                          <div key={tier} className="flex items-center gap-2">
                            <Checkbox
                              id={`tier-${tier}`}
                              data-testid={`checkbox-tier-${tier}`}
                              checked={newCustomerServiceTiers.includes(tier)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewCustomerServiceTiers([...newCustomerServiceTiers, tier]);
                                } else {
                                  setNewCustomerServiceTiers(newCustomerServiceTiers.filter((t) => t !== tier));
                                }
                              }}
                              disabled={!isAdmin}
                            />
                            <Label htmlFor={`tier-${tier}`} className="text-sm">{tier}</Label>
                          </div>
                        ))}
                      </div>
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
                          <span className="font-medium" data-testid="text-baseline-upsell-value">{baseline.optionalToolIds.length}</span>
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
                        {selectedCustomer.serviceTiers?.map((tier) => (
                          <Pill key={tier} tone="neutral" testId={`pill-tier-${tier}`}>
                            {tier}
                          </Pill>
                        ))}
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
                              const inUpsell = baseline.optionalToolIds.includes(t.id);

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
