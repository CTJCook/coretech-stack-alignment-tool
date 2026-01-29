import * as React from "react";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Layers,
  Grid3X3,
  CheckCircle2,
  XCircle,
  Save,
  X,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCategories, useTools, useBaselines } from "@/hooks/use-stack-data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category, Tool, Baseline } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminPortal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: tools = [], isLoading: toolsLoading } = useTools();
  const { data: baselines = [], isLoading: baselinesLoading } = useBaselines();

  const [editingCategory, setEditingCategory] = React.useState<string | null>(null);
  const [categoryForm, setCategoryForm] = React.useState({ name: "", description: "", sortOrder: 0 });

  const [editingTool, setEditingTool] = React.useState<string | null>(null);
  const [toolForm, setToolForm] = React.useState({ name: "", vendor: "", categoryId: "", tags: [] as string[] });

  const [editingBaseline, setEditingBaseline] = React.useState<string | null>(null);
  const [baselineForm, setBaselineForm] = React.useState({
    name: "",
    description: "",
    requiredToolIds: [] as string[],
    optionalToolIds: [] as string[],
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: Omit<Category, "id">) => api.categories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category created" });
      setCategoryForm({ name: "", description: "", sortOrder: 0 });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Category, "id">> }) =>
      api.categories.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category updated" });
      setEditingCategory(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category deleted" });
    },
  });

  const createToolMutation = useMutation({
    mutationFn: (data: Omit<Tool, "id">) => api.tools.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast({ title: "Tool created" });
      setToolForm({ name: "", vendor: "", categoryId: "", tags: [] });
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Tool, "id">> }) =>
      api.tools.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast({ title: "Tool updated" });
      setEditingTool(null);
    },
  });

  const deleteToolMutation = useMutation({
    mutationFn: (id: string) => api.tools.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast({ title: "Tool deleted" });
    },
  });

  const createBaselineMutation = useMutation({
    mutationFn: (data: Omit<Baseline, "id">) => api.baselines.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["baselines"] });
      toast({ title: "Baseline created" });
      setBaselineForm({ name: "", description: "", requiredToolIds: [], optionalToolIds: [] });
    },
  });

  const updateBaselineMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Baseline, "id">> }) =>
      api.baselines.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["baselines"] });
      toast({ title: "Baseline updated" });
      setEditingBaseline(null);
    },
  });

  const deleteBaselineMutation = useMutation({
    mutationFn: (id: string) => api.baselines.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["baselines"] });
      toast({ title: "Baseline deleted" });
    },
  });

  function startEditCategory(category: Category) {
    setEditingCategory(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
    });
  }

  function startEditTool(tool: Tool) {
    setEditingTool(tool.id);
    setToolForm({
      name: tool.name,
      vendor: tool.vendor || "",
      categoryId: tool.categoryId,
      tags: tool.tags || [],
    });
  }

  function startEditBaseline(baseline: Baseline) {
    setEditingBaseline(baseline.id);
    setBaselineForm({
      name: baseline.name,
      description: baseline.description,
      requiredToolIds: baseline.requiredToolIds,
      optionalToolIds: baseline.optionalToolIds,
    });
  }

  function saveCategory() {
    if (!categoryForm.name.trim() || !categoryForm.description.trim()) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  }

  function saveTool() {
    if (!toolForm.name.trim() || !toolForm.categoryId) {
      toast({ title: "Fill required fields", variant: "destructive" });
      return;
    }

    if (editingTool) {
      updateToolMutation.mutate({ id: editingTool, data: toolForm });
    } else {
      createToolMutation.mutate(toolForm);
    }
  }

  function saveBaseline() {
    if (!baselineForm.name.trim() || !baselineForm.description.trim()) {
      toast({ title: "Fill required fields", variant: "destructive" });
      return;
    }

    if (editingBaseline) {
      updateBaselineMutation.mutate({ id: editingBaseline, data: baselineForm });
    } else {
      createBaselineMutation.mutate(baselineForm);
    }
  }

  function toggleToolInBaseline(toolId: string, list: "required" | "optional") {
    if (list === "required") {
      const isIn = baselineForm.requiredToolIds.includes(toolId);
      setBaselineForm({
        ...baselineForm,
        requiredToolIds: isIn
          ? baselineForm.requiredToolIds.filter((id) => id !== toolId)
          : [...baselineForm.requiredToolIds, toolId],
        optionalToolIds: baselineForm.optionalToolIds.filter((id) => id !== toolId),
      });
    } else {
      const isIn = baselineForm.optionalToolIds.includes(toolId);
      setBaselineForm({
        ...baselineForm,
        optionalToolIds: isIn
          ? baselineForm.optionalToolIds.filter((id) => id !== toolId)
          : [...baselineForm.optionalToolIds, toolId],
        requiredToolIds: baselineForm.requiredToolIds.filter((id) => id !== toolId),
      });
    }
  }

  if (categoriesLoading || toolsLoading || baselinesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading admin portal...</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="glass noise relative rounded-3xl border bg-white/70 p-6 shadow-md backdrop-blur dark:bg-white/5">
          <div className="mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-to-tracker">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Stack Tracker
              </Button>
            </Link>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <h1 data-testid="text-admin-title" className="font-serif text-2xl tracking-tight">
                  Admin Portal
                </h1>
              </div>
              <p data-testid="text-admin-subtitle" className="mt-1 text-sm text-muted-foreground">
                Manage categories, tools, and baseline configurations
              </p>
            </div>
            <Badge variant="secondary" data-testid="badge-admin">
              Administrator
            </Badge>
          </div>

          <Separator className="my-6" />

          <Tabs defaultValue="categories">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white/60 p-1 dark:bg-white/5">
              <TabsTrigger value="categories" data-testid="tab-categories">
                <Grid3X3 className="mr-2 h-4 w-4" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="tools" data-testid="tab-tools">
                <Layers className="mr-2 h-4 w-4" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="baselines" data-testid="tab-baselines">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Baselines
              </TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="mt-6 space-y-4">
              <Card className="rounded-2xl border bg-white/60 p-4 dark:bg-white/5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium" data-testid="text-create-category-title">
                    {editingCategory ? "Edit Category" : "Create Category"}
                  </h3>
                  {editingCategory && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({ name: "", description: "", sortOrder: 0 });
                      }}
                      data-testid="button-cancel-edit-category"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="e.g., RMM"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      data-testid="input-category-name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Input
                      placeholder="e.g., Remote Monitoring and Management"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      data-testid="input-category-description"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Sort Order</Label>
                    <Input
                      type="number"
                      value={categoryForm.sortOrder}
                      onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })}
                      data-testid="input-category-sort-order"
                    />
                  </div>
                  <Button onClick={saveCategory} data-testid="button-save-category">
                    <Save className="mr-2 h-4 w-4" />
                    {editingCategory ? "Update" : "Create"}
                  </Button>
                </div>
              </Card>

              <div className="grid gap-3">
                {categories.map((category) => (
                  <Card
                    key={category.id}
                    className="flex items-center justify-between rounded-2xl border bg-white/60 p-4 dark:bg-white/5"
                    data-testid={`card-category-${category.id}`}
                  >
                    <div>
                      <div className="font-medium" data-testid={`text-category-name-${category.id}`}>
                        {category.name}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`text-category-desc-${category.id}`}>
                        {category.description}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">Sort: {category.sortOrder}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditCategory(category)}
                        data-testid={`button-edit-category-${category.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategoryMutation.mutate(category.id)}
                        data-testid={`button-delete-category-${category.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tools" className="mt-6 space-y-4">
              <Card className="rounded-2xl border bg-white/60 p-4 dark:bg-white/5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium" data-testid="text-create-tool-title">
                    {editingTool ? "Edit Tool" : "Create Tool"}
                  </h3>
                  {editingTool && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTool(null);
                        setToolForm({ name: "", vendor: "", categoryId: "", tags: [] });
                      }}
                      data-testid="button-cancel-edit-tool"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="e.g., NinjaOne RMM"
                      value={toolForm.name}
                      onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })}
                      data-testid="input-tool-name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vendor</Label>
                    <Input
                      placeholder="e.g., NinjaOne"
                      value={toolForm.vendor}
                      onChange={(e) => setToolForm({ ...toolForm, vendor: e.target.value })}
                      data-testid="input-tool-vendor"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select
                      value={toolForm.categoryId}
                      onValueChange={(v) => setToolForm({ ...toolForm, categoryId: v })}
                    >
                      <SelectTrigger data-testid="select-tool-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={saveTool} data-testid="button-save-tool">
                    <Save className="mr-2 h-4 w-4" />
                    {editingTool ? "Update" : "Create"}
                  </Button>
                </div>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2">
                {tools.map((tool) => {
                  const category = categories.find((c) => c.id === tool.categoryId);
                  return (
                    <Card
                      key={tool.id}
                      className="flex items-start justify-between rounded-2xl border bg-white/60 p-4 dark:bg-white/5"
                      data-testid={`card-tool-${tool.id}`}
                    >
                      <div>
                        <div className="font-medium" data-testid={`text-tool-name-${tool.id}`}>
                          {tool.name}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-tool-vendor-${tool.id}`}>
                          {tool.vendor || "No vendor"}
                        </div>
                        <Badge variant="secondary" className="mt-1">
                          {category?.name || "Unknown"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditTool(tool)}
                          data-testid={`button-edit-tool-${tool.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteToolMutation.mutate(tool.id)}
                          data-testid={`button-delete-tool-${tool.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="baselines" className="mt-6 space-y-4">
              <Card className="rounded-2xl border bg-white/60 p-4 dark:bg-white/5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium" data-testid="text-create-baseline-title">
                    {editingBaseline ? "Edit Baseline" : "Create Baseline"}
                  </h3>
                  {editingBaseline && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingBaseline(null);
                        setBaselineForm({ name: "", description: "", requiredToolIds: [], optionalToolIds: [] });
                      }}
                      data-testid="button-cancel-edit-baseline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="e.g., SMB Standard"
                      value={baselineForm.name}
                      onChange={(e) => setBaselineForm({ ...baselineForm, name: e.target.value })}
                      data-testid="input-baseline-name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Input
                      placeholder="e.g., Core stack for small-medium businesses"
                      value={baselineForm.description}
                      onChange={(e) => setBaselineForm({ ...baselineForm, description: e.target.value })}
                      data-testid="input-baseline-description"
                    />
                  </div>

                  <Separator className="my-2" />

                  <div>
                    <Label className="mb-2 block text-xs font-medium">Configure Tools (Required/Optional)</Label>
                    <ScrollArea className="h-96 rounded-xl border bg-white/40 p-4">
                      {categories.map((category) => {
                        const categoryTools = tools.filter((t) => t.categoryId === category.id);
                        if (categoryTools.length === 0) return null;

                        return (
                          <div key={category.id} className="mb-4">
                            <div className="mb-2 text-sm font-medium">{category.name}</div>
                            <div className="grid gap-2">
                              {categoryTools.map((tool) => {
                                const isRequired = baselineForm.requiredToolIds.includes(tool.id);
                                const isOptional = baselineForm.optionalToolIds.includes(tool.id);

                                return (
                                  <div
                                    key={tool.id}
                                    className="flex items-center justify-between rounded-xl border bg-white/60 px-3 py-2"
                                    data-testid={`baseline-tool-${tool.id}`}
                                  >
                                    <div className="text-sm">{tool.name}</div>
                                    <div className="flex gap-2">
                                      <label className="flex cursor-pointer items-center gap-1">
                                        <Checkbox
                                          checked={isRequired}
                                          onCheckedChange={() => toggleToolInBaseline(tool.id, "required")}
                                          data-testid={`checkbox-required-${tool.id}`}
                                        />
                                        <span className="text-xs">Required</span>
                                      </label>
                                      <label className="flex cursor-pointer items-center gap-1">
                                        <Checkbox
                                          checked={isOptional}
                                          onCheckedChange={() => toggleToolInBaseline(tool.id, "optional")}
                                          data-testid={`checkbox-optional-${tool.id}`}
                                        />
                                        <span className="text-xs">Optional</span>
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </ScrollArea>
                  </div>

                  <Button onClick={saveBaseline} data-testid="button-save-baseline">
                    <Save className="mr-2 h-4 w-4" />
                    {editingBaseline ? "Update" : "Create"}
                  </Button>
                </div>
              </Card>

              <div className="grid gap-3">
                {baselines.map((baseline) => (
                  <Card
                    key={baseline.id}
                    className="rounded-2xl border bg-white/60 p-4 dark:bg-white/5"
                    data-testid={`card-baseline-${baseline.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium" data-testid={`text-baseline-name-${baseline.id}`}>
                          {baseline.name}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-baseline-desc-${baseline.id}`}>
                          {baseline.description}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="secondary">
                            {baseline.requiredToolIds.length} required
                          </Badge>
                          <Badge variant="outline">
                            {baseline.optionalToolIds.length} optional
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditBaseline(baseline)}
                          data-testid={`button-edit-baseline-${baseline.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBaselineMutation.mutate(baseline.id)}
                          data-testid={`button-delete-baseline-${baseline.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
