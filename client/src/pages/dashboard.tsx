import * as React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Users,
  BarChart3,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useTools, useBaselines, useCustomers } from "@/hooks/use-stack-data";
import type { Customer, Tool, Baseline, Category } from "@shared/schema";

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function computeCoverage(currentToolIds: string[], requiredToolIds: string[]) {
  const required = uniq(requiredToolIds);
  const current = new Set(currentToolIds);
  const covered = required.filter((id) => current.has(id)).length;
  const total = required.length;
  const pct = total === 0 ? 100 : (covered / total) * 100;
  return { covered, total, pct };
}

function diffMissing(currentToolIds: string[], requiredToolIds: string[]) {
  const current = new Set(currentToolIds);
  return uniq(requiredToolIds).filter((id) => !current.has(id));
}

type SortField = "name" | "coverage" | "gaps";
type SortDirection = "asc" | "desc";

export default function Dashboard() {
  const { data: customers = [] } = useCustomers();
  const { data: tools = [] } = useTools();
  const { data: baselines = [] } = useBaselines();
  const { data: categories = [] } = useCategories();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortField, setSortField] = React.useState<SortField>("gaps");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");
  const [filterBaseline, setFilterBaseline] = React.useState<string>("all");

  const toolById = (id: string) => tools.find((t) => t.id === id);
  const baselineById = (id: string) => baselines.find((b) => b.id === id);
  const categoryById = (id: string) => categories.find((c) => c.id === id);

  const customersWithGaps = React.useMemo(() => {
    return customers.map((customer) => {
      const baseline = baselineById(customer.baselineId ?? "");
      const requiredToolIds = baseline?.requiredToolIds ?? [];
      const coverage = computeCoverage(customer.currentToolIds ?? [], requiredToolIds);
      const missingToolIds = diffMissing(customer.currentToolIds ?? [], requiredToolIds);
      const missingTools = missingToolIds
        .map((id) => {
          const tool = toolById(id);
          const category = tool ? categoryById(tool.categoryId) : null;
          return tool ? { ...tool, categoryName: category?.name ?? "Unknown" } : null;
        })
        .filter(Boolean) as (Tool & { categoryName: string })[];

      return {
        ...customer,
        baseline,
        coverage,
        gapCount: missingToolIds.length,
        missingTools,
      };
    });
  }, [customers, baselines, tools, categories]);

  const filteredAndSortedCustomers = React.useMemo(() => {
    let result = customersWithGaps;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.primaryContactName?.toLowerCase().includes(q) ||
          c.contactEmail?.toLowerCase().includes(q)
      );
    }

    if (filterBaseline !== "all") {
      result = result.filter((c) => c.baselineId === filterBaseline);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === "coverage") {
        cmp = a.coverage.pct - b.coverage.pct;
      } else if (sortField === "gaps") {
        cmp = a.gapCount - b.gapCount;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [customersWithGaps, searchQuery, filterBaseline, sortField, sortDirection]);

  const summaryStats = React.useMemo(() => {
    const total = customersWithGaps.length;
    const withGaps = customersWithGaps.filter((c) => c.gapCount > 0).length;
    const fullyAligned = total - withGaps;
    const avgCoverage =
      total > 0
        ? customersWithGaps.reduce((acc, c) => acc + c.coverage.pct, 0) / total
        : 0;
    return { total, withGaps, fullyAligned, avgCoverage };
  }, [customersWithGaps]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "name" ? "asc" : "desc");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-xl" data-testid="btn-back-home">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-dashboard-title">
                  Customer Gap Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Quick overview of all customers and their alignment status
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl p-4" data-testid="card-stat-total">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-500/10 p-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{summaryStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total Customers</div>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl p-4" data-testid="card-stat-gaps">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-500/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{summaryStats.withGaps}</div>
                  <div className="text-xs text-muted-foreground">With Gaps</div>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl p-4" data-testid="card-stat-aligned">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{summaryStats.fullyAligned}</div>
                  <div className="text-xs text-muted-foreground">Fully Aligned</div>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl p-4" data-testid="card-stat-avg">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-500/10 p-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{Math.round(summaryStats.avgCoverage)}%</div>
                  <div className="text-xs text-muted-foreground">Avg Coverage</div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="rounded-3xl p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl sm:w-64"
                  data-testid="input-search"
                />
                <Select value={filterBaseline} onValueChange={setFilterBaseline}>
                  <SelectTrigger className="w-full rounded-xl sm:w-48" data-testid="select-baseline-filter">
                    <SelectValue placeholder="All Baselines" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Baselines</SelectItem>
                    {baselines.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-customers">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 pr-4">
                      <button
                        onClick={() => toggleSort("name")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        data-testid="btn-sort-name"
                      >
                        Customer
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="pb-3 pr-4">Baseline</th>
                    <th className="pb-3 pr-4">
                      <button
                        onClick={() => toggleSort("coverage")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        data-testid="btn-sort-coverage"
                      >
                        Coverage
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="pb-3 pr-4">
                      <button
                        onClick={() => toggleSort("gaps")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        data-testid="btn-sort-gaps"
                      >
                        Gaps
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="pb-3">Missing Tools</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b last:border-0 hover:bg-muted/30"
                        data-testid={`row-customer-${customer.id}`}
                      >
                        <td className="py-4 pr-4">
                          <Link href={`/?customer=${customer.id}`}>
                            <div className="cursor-pointer">
                              <div className="font-medium hover:text-blue-600" data-testid={`text-customer-name-${customer.id}`}>
                                {customer.name}
                              </div>
                              {customer.primaryContactName && (
                                <div className="text-xs text-muted-foreground">
                                  {customer.primaryContactName}
                                </div>
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="py-4 pr-4">
                          <Badge variant="secondary" className="rounded-lg" data-testid={`badge-baseline-${customer.id}`}>
                            {customer.baseline?.name ?? "None"}
                          </Badge>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={customer.coverage.pct}
                              className="h-2 w-20"
                              data-testid={`progress-coverage-${customer.id}`}
                            />
                            <span
                              className={`text-sm font-medium ${
                                customer.coverage.pct >= 80
                                  ? "text-emerald-600"
                                  : customer.coverage.pct >= 50
                                    ? "text-amber-600"
                                    : "text-red-600"
                              }`}
                              data-testid={`text-coverage-${customer.id}`}
                            >
                              {Math.round(customer.coverage.pct)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          {customer.gapCount === 0 ? (
                            <Badge
                              variant="secondary"
                              className="rounded-lg bg-emerald-500/10 text-emerald-700"
                              data-testid={`badge-gaps-${customer.id}`}
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Aligned
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="rounded-lg bg-amber-500/10 text-amber-700"
                              data-testid={`badge-gaps-${customer.id}`}
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              {customer.gapCount} gap{customer.gapCount === 1 ? "" : "s"}
                            </Badge>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-1" data-testid={`missing-tools-${customer.id}`}>
                            {customer.missingTools.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              customer.missingTools.slice(0, 3).map((tool) => (
                                <Badge
                                  key={tool.id}
                                  variant="outline"
                                  className="rounded-lg text-xs"
                                  data-testid={`badge-missing-${tool.id}`}
                                >
                                  {tool.name}
                                </Badge>
                              ))
                            )}
                            {customer.missingTools.length > 3 && (
                              <Badge variant="outline" className="rounded-lg text-xs">
                                +{customer.missingTools.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
