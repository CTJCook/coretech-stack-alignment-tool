import * as React from "react";
import {
  ArrowLeft,
  Check,
  Cloud,
  Download,
  Eye,
  Link2,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useBaselines, useTools } from "@/hooks/use-stack-data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type PreviewCompany } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ConnectwiseTypeMapping, ConnectwiseSkuMapping } from "@shared/schema";

export default function ConnectwiseAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: baselines = [] } = useBaselines();
  const { data: tools = [] } = useTools();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["connectwise-settings"],
    queryFn: () => api.connectwise.getSettings(),
  });

  const { data: typeMappings = [], isLoading: typeMappingsLoading } = useQuery({
    queryKey: ["connectwise-type-mappings"],
    queryFn: () => api.connectwise.getTypeMappings(),
  });

  const { data: skuMappings = [], isLoading: skuMappingsLoading } = useQuery({
    queryKey: ["connectwise-sku-mappings"],
    queryFn: () => api.connectwise.getSkuMappings(),
  });

  const [settingsForm, setSettingsForm] = React.useState({
    companyId: "",
    publicKey: "",
    privateKey: "",
    siteUrl: "",
    clientId: "",
    enabled: false,
  });

  const [testingConnection, setTestingConnection] = React.useState(false);
  const [connectionResult, setConnectionResult] = React.useState<{ success: boolean; message: string } | null>(null);

  const [newTypeMapping, setNewTypeMapping] = React.useState({
    cwTypeName: "",
    baselineId: "",
    serviceTiers: ["Essentials"] as string[],
    shouldImport: true,
  });

  const [newSkuMapping, setNewSkuMapping] = React.useState({
    sku: "",
    skuDescription: "",
    toolId: "",
  });

  const [syncing, setSyncing] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<any>(null);
  
  const [previewCompanies, setPreviewCompanies] = React.useState<PreviewCompany[]>([]);
  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [importingCompanyId, setImportingCompanyId] = React.useState<number | null>(null);
  const [cwCompanyTypes, setCwCompanyTypes] = React.useState<Array<{ id: number; name: string }>>([]);
  const [loadingCwTypes, setLoadingCwTypes] = React.useState(false);

  async function fetchCwCompanyTypes() {
    if (!settings?.enabled) return;
    setLoadingCwTypes(true);
    try {
      const types = await api.connectwise.getCompanyTypes();
      setCwCompanyTypes(types);
      setNewTypeMapping(prev => ({ ...prev, cwTypeName: "" }));
    } catch (error) {
      toast({ title: "Failed to fetch company types", description: String(error), variant: "destructive" });
    } finally {
      setLoadingCwTypes(false);
    }
  }

  React.useEffect(() => {
    if (settings) {
      setSettingsForm({
        companyId: settings.companyId || "",
        publicKey: settings.publicKey || "",
        privateKey: "",
        siteUrl: settings.siteUrl || "",
        clientId: settings.clientId || "",
        enabled: settings.enabled || false,
      });
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: (data: typeof settingsForm) => api.connectwise.saveSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectwise-settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to save settings", description: String(error), variant: "destructive" });
    },
  });

  const createTypeMappingMutation = useMutation({
    mutationFn: (data: Omit<ConnectwiseTypeMapping, "id">) => api.connectwise.createTypeMapping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectwise-type-mappings"] });
      toast({ title: "Type mapping created" });
      setNewTypeMapping({ cwTypeName: "", baselineId: "", serviceTiers: ["Essentials"], shouldImport: true });
    },
    onError: (error) => {
      toast({ title: "Failed to create type mapping", description: String(error), variant: "destructive" });
    },
  });

  const deleteTypeMappingMutation = useMutation({
    mutationFn: (id: string) => api.connectwise.deleteTypeMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectwise-type-mappings"] });
      toast({ title: "Type mapping deleted" });
    },
  });

  const createSkuMappingMutation = useMutation({
    mutationFn: (data: Omit<ConnectwiseSkuMapping, "id">) => api.connectwise.createSkuMapping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectwise-sku-mappings"] });
      toast({ title: "SKU mapping created" });
      setNewSkuMapping({ sku: "", skuDescription: "", toolId: "" });
    },
    onError: (error) => {
      toast({ title: "Failed to create SKU mapping", description: String(error), variant: "destructive" });
    },
  });

  const deleteSkuMappingMutation = useMutation({
    mutationFn: (id: string) => api.connectwise.deleteSkuMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectwise-sku-mappings"] });
      toast({ title: "SKU mapping deleted" });
    },
  });

  const [syncProgress, setSyncProgress] = React.useState<{
    status: string;
    currentStep: string;
    companiesProcessed: number;
    companiesTotal: number;
    errors: string[];
  } | null>(null);

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (syncing) {
      interval = setInterval(async () => {
        try {
          const progress = await api.connectwise.getSyncProgress();
          if (progress) {
            setSyncProgress(progress);
          }
        } catch (e) {
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncing]);

  async function testConnection() {
    if (!settingsForm.companyId || !settingsForm.publicKey || !settingsForm.siteUrl || !settingsForm.clientId) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }

    const hasExistingKey = settings?.hasPrivateKey;
    if (!settingsForm.privateKey && !hasExistingKey) {
      toast({ title: "Private key is required", variant: "destructive" });
      return;
    }

    setTestingConnection(true);
    setConnectionResult(null);

    try {
      const result = await api.connectwise.testConnection({
        ...settingsForm,
        privateKey: settingsForm.privateKey,
        useExistingKey: hasExistingKey && !settingsForm.privateKey,
      });
      setConnectionResult(result);
    } catch (error) {
      setConnectionResult({ success: false, message: String(error) });
    } finally {
      setTestingConnection(false);
    }
  }

  async function runSync() {
    setSyncing(true);
    setSyncResult(null);
    setSyncProgress(null);

    try {
      const result = await api.connectwise.runSync();
      setSyncResult(result);
      setSyncProgress(null);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["connectwise-settings"] });
      toast({ 
        title: result.success ? "Sync completed" : "Sync completed with errors",
        description: `Imported: ${result.companiesImported}, Updated: ${result.companiesUpdated}, Skipped: ${result.companiesSkipped}`,
      });
    } catch (error) {
      setSyncResult({ success: false, errors: [String(error)] });
      toast({ title: "Sync failed", description: String(error), variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  }

  function saveSettings() {
    if (!settingsForm.companyId || !settingsForm.publicKey || !settingsForm.siteUrl || !settingsForm.clientId) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }

    if (!settingsForm.privateKey && !settings?.hasPrivateKey) {
      toast({ title: "Private key is required", variant: "destructive" });
      return;
    }

    saveSettingsMutation.mutate({
      ...settingsForm,
      privateKey: settingsForm.privateKey,
    });
  }

  function addTypeMapping() {
    if (!newTypeMapping.cwTypeName) {
      toast({ title: "Company type name is required", variant: "destructive" });
      return;
    }

    createTypeMappingMutation.mutate({
      cwTypeName: newTypeMapping.cwTypeName,
      baselineId: newTypeMapping.baselineId || null,
      serviceTiers: newTypeMapping.serviceTiers,
      shouldImport: newTypeMapping.shouldImport,
    });
  }

  function addSkuMapping() {
    if (!newSkuMapping.sku) {
      toast({ title: "SKU is required", variant: "destructive" });
      return;
    }

    createSkuMappingMutation.mutate({
      sku: newSkuMapping.sku,
      skuDescription: newSkuMapping.skuDescription || null,
      toolId: newSkuMapping.toolId || null,
    });
  }

  if (settingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading ConnectWise settings...</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="glass noise relative rounded-3xl border bg-white/70 p-6 shadow-md backdrop-blur dark:bg-white/5">
          <div className="mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" data-testid="button-back-to-admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin Portal
              </Button>
            </Link>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-xl font-semibold" data-testid="text-page-title">ConnectWise Integration</h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect to ConnectWise Manage to automatically import customers and activate tools based on agreements
              </p>
            </div>

            <Button
              onClick={runSync}
              disabled={syncing || !settings?.enabled}
              data-testid="button-run-sync"
            >
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run Sync
            </Button>
          </div>

          <Separator className="my-6" />

          {syncProgress && syncing && (
            <Card className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">Sync in Progress</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-300">{syncProgress.currentStep}</p>
                  {syncProgress.companiesTotal > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-blue-600 dark:text-blue-300 mb-1">
                        <span>Processing companies</span>
                        <span>{syncProgress.companiesProcessed} / {syncProgress.companiesTotal}</span>
                      </div>
                      <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${(syncProgress.companiesProcessed / syncProgress.companiesTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Tabs defaultValue="settings" className="space-y-6">
            <TabsList className="flex flex-wrap gap-1">
              <TabsTrigger value="settings" data-testid="tab-settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="type-mappings" data-testid="tab-type-mappings">
                <Link2 className="mr-2 h-4 w-4" />
                Type Mappings
              </TabsTrigger>
              <TabsTrigger value="sku-mappings" data-testid="tab-sku-mappings">
                <Link2 className="mr-2 h-4 w-4" />
                SKU Mappings
              </TabsTrigger>
              <TabsTrigger value="preview-import" data-testid="tab-preview-import" disabled={!settings?.enabled}>
                <Eye className="mr-2 h-4 w-4" />
                Preview & Import
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">API Credentials</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your ConnectWise Manage API credentials. You can find these in ConnectWise under System &gt; Members &gt; API Members.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteUrl">Site URL</Label>
                    <Input
                      id="siteUrl"
                      placeholder="api-na.myconnectwise.net"
                      value={settingsForm.siteUrl}
                      onChange={(e) => setSettingsForm({ ...settingsForm, siteUrl: e.target.value })}
                      data-testid="input-site-url"
                    />
                    <p className="text-xs text-muted-foreground">e.g., api-na.myconnectwise.net</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyId">Company ID</Label>
                    <Input
                      id="companyId"
                      placeholder="yourcompany"
                      value={settingsForm.companyId}
                      onChange={(e) => setSettingsForm({ ...settingsForm, companyId: e.target.value })}
                      data-testid="input-company-id"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="publicKey">Public Key</Label>
                    <Input
                      id="publicKey"
                      placeholder="Public API key"
                      value={settingsForm.publicKey}
                      onChange={(e) => setSettingsForm({ ...settingsForm, publicKey: e.target.value })}
                      data-testid="input-public-key"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="privateKey">Private Key</Label>
                    <Input
                      id="privateKey"
                      type="password"
                      placeholder={settings?.hasPrivateKey ? "••••••••" : "Private API key"}
                      value={settingsForm.privateKey}
                      onChange={(e) => setSettingsForm({ ...settingsForm, privateKey: e.target.value })}
                      data-testid="input-private-key"
                    />
                    {settings?.hasPrivateKey && (
                      <p className="text-xs text-muted-foreground">Leave blank to keep existing key</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      placeholder="Client ID from ConnectWise developer portal"
                      value={settingsForm.clientId}
                      onChange={(e) => setSettingsForm({ ...settingsForm, clientId: e.target.value })}
                      data-testid="input-client-id"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="enabled"
                      checked={settingsForm.enabled}
                      onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, enabled: checked })}
                      data-testid="switch-enabled"
                    />
                    <Label htmlFor="enabled">Enable Integration</Label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={testConnection}
                    disabled={testingConnection}
                    data-testid="button-test-connection"
                  >
                    {testingConnection ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Test Connection
                  </Button>

                  <Button onClick={saveSettings} disabled={saveSettingsMutation.isPending} data-testid="button-save-settings">
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </div>

                {connectionResult && (
                  <div className={`flex items-center gap-2 rounded-lg p-3 ${connectionResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {connectionResult.success ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span className="text-sm">{connectionResult.message}</span>
                  </div>
                )}

                {settings?.lastSyncAt && (
                  <div className="mt-4 rounded-lg bg-muted/50 p-4">
                    <h4 className="text-sm font-medium">Last Sync</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(settings.lastSyncAt).toLocaleString()} - {settings.lastSyncStatus}
                    </p>
                    {settings.lastSyncMessage && (
                      <p className="text-sm text-muted-foreground">{settings.lastSyncMessage}</p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="type-mappings" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Company Type Mappings</h3>
                    <p className="text-sm text-muted-foreground">
                      Map ConnectWise company types to baselines. Only companies with mapped types will be imported.
                    </p>
                  </div>
                  {settings?.enabled && (
                    <Button 
                      variant="outline" 
                      onClick={fetchCwCompanyTypes} 
                      disabled={loadingCwTypes}
                      data-testid="button-fetch-types"
                    >
                      {loadingCwTypes ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Fetch Types from CW
                    </Button>
                  )}
                </div>

                <Card className="p-4">
                  <h4 className="mb-4 text-sm font-medium">Add New Mapping</h4>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label>CW Type Name</Label>
                      {cwCompanyTypes.length > 0 ? (
                        <Select
                          value={newTypeMapping.cwTypeName}
                          onValueChange={(v) => setNewTypeMapping({ ...newTypeMapping, cwTypeName: v })}
                        >
                          <SelectTrigger data-testid="select-type-name">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {cwCompanyTypes.map((t) => (
                              <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="e.g., Client"
                          value={newTypeMapping.cwTypeName}
                          onChange={(e) => setNewTypeMapping({ ...newTypeMapping, cwTypeName: e.target.value })}
                          data-testid="input-type-name"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Baseline</Label>
                      <Select
                        value={newTypeMapping.baselineId}
                        onValueChange={(v) => setNewTypeMapping({ ...newTypeMapping, baselineId: v })}
                      >
                        <SelectTrigger data-testid="select-type-baseline">
                          <SelectValue placeholder="Select baseline" />
                        </SelectTrigger>
                        <SelectContent>
                          {baselines.map((b) => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Service Tier</Label>
                      <Select
                        value={newTypeMapping.serviceTiers[0]}
                        onValueChange={(v) => setNewTypeMapping({ ...newTypeMapping, serviceTiers: [v] })}
                      >
                        <SelectTrigger data-testid="select-type-tier">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Essentials">Essentials</SelectItem>
                          <SelectItem value="MSP">MSP</SelectItem>
                          <SelectItem value="Break-Fix">Break-Fix</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button onClick={addTypeMapping} disabled={createTypeMappingMutation.isPending} data-testid="button-add-type-mapping">
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>

                <div className="space-y-2">
                  {typeMappingsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading mappings...</p>
                  ) : typeMappings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No type mappings configured yet.</p>
                  ) : (
                    typeMappings.map((mapping) => {
                      const baseline = baselines.find((b) => b.id === mapping.baselineId);
                      return (
                        <div
                          key={mapping.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                          data-testid={`type-mapping-${mapping.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-medium">{mapping.cwTypeName}</span>
                            <Badge variant="outline">{baseline?.name || "No baseline"}</Badge>
                            <Badge variant="secondary">{mapping.serviceTiers?.join(", ") || "Essentials"}</Badge>
                            {!mapping.shouldImport && (
                              <Badge variant="destructive">Skip Import</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTypeMappingMutation.mutate(mapping.id)}
                            data-testid={`button-delete-type-${mapping.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sku-mappings" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">SKU to Tool Mappings</h3>
                <p className="text-sm text-muted-foreground">
                  Map ConnectWise agreement SKUs to tools. When a customer has an agreement with a mapped SKU, that tool will be automatically enabled.
                </p>

                <Card className="p-4">
                  <h4 className="mb-4 text-sm font-medium">Add New SKU Mapping</h4>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input
                        placeholder="e.g., SEN-CYL-PRO"
                        value={newSkuMapping.sku}
                        onChange={(e) => setNewSkuMapping({ ...newSkuMapping, sku: e.target.value })}
                        data-testid="input-sku"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input
                        placeholder="SKU description"
                        value={newSkuMapping.skuDescription}
                        onChange={(e) => setNewSkuMapping({ ...newSkuMapping, skuDescription: e.target.value })}
                        data-testid="input-sku-description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tool</Label>
                      <Select
                        value={newSkuMapping.toolId}
                        onValueChange={(v) => setNewSkuMapping({ ...newSkuMapping, toolId: v })}
                      >
                        <SelectTrigger data-testid="select-sku-tool">
                          <SelectValue placeholder="Select tool" />
                        </SelectTrigger>
                        <SelectContent>
                          {tools.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button onClick={addSkuMapping} disabled={createSkuMappingMutation.isPending} data-testid="button-add-sku-mapping">
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>

                <div className="space-y-2">
                  {skuMappingsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading mappings...</p>
                  ) : skuMappings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No SKU mappings configured yet.</p>
                  ) : (
                    skuMappings.map((mapping) => {
                      const tool = tools.find((t) => t.id === mapping.toolId);
                      return (
                        <div
                          key={mapping.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                          data-testid={`sku-mapping-${mapping.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <code className="rounded bg-muted px-2 py-1 text-sm">{mapping.sku}</code>
                            {mapping.skuDescription && (
                              <span className="text-sm text-muted-foreground">{mapping.skuDescription}</span>
                            )}
                            <Badge variant="outline">{tool?.name || "No tool"}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSkuMappingMutation.mutate(mapping.id)}
                            data-testid={`button-delete-sku-${mapping.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview-import" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Preview & Import Companies</h3>
                    <p className="text-sm text-muted-foreground">
                      Preview companies that match your type mappings and selectively import them one at a time.
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      setLoadingPreview(true);
                      try {
                        const companies = await api.connectwise.previewCompanies();
                        setPreviewCompanies(companies);
                      } catch (error) {
                        toast({ title: "Failed to load companies", description: String(error), variant: "destructive" });
                      } finally {
                        setLoadingPreview(false);
                      }
                    }}
                    disabled={loadingPreview}
                    data-testid="button-preview-companies"
                  >
                    {loadingPreview ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {loadingPreview ? "Loading..." : "Load Companies"}
                  </Button>
                </div>

                {previewCompanies.length > 0 && (
                  <div className="rounded-lg border">
                    <div className="grid grid-cols-[1fr_1fr_1fr_120px] gap-4 border-b bg-muted/50 p-3 text-sm font-medium">
                      <div>Company Name</div>
                      <div>Type / Baseline</div>
                      <div>Contact</div>
                      <div className="text-center">Action</div>
                    </div>
                    <div className="max-h-[500px] overflow-auto">
                      {previewCompanies.map((company) => (
                        <div
                          key={company.cwCompanyId}
                          className="grid grid-cols-[1fr_1fr_1fr_120px] gap-4 border-b p-3 text-sm last:border-b-0"
                          data-testid={`preview-company-${company.cwCompanyId}`}
                        >
                          <div>
                            <div className="font-medium">{company.name}</div>
                            {company.address && (
                              <div className="text-xs text-muted-foreground">{company.address}</div>
                            )}
                          </div>
                          <div>
                            <Badge variant="outline">{company.typeName}</Badge>
                            {company.matchingBaseline && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                → {company.matchingBaseline}
                              </div>
                            )}
                          </div>
                          <div>
                            {company.contactName && <div>{company.contactName}</div>}
                            {company.phone && (
                              <div className="text-xs text-muted-foreground">{company.phone}</div>
                            )}
                          </div>
                          <div className="flex items-center justify-center">
                            {company.alreadyImported ? (
                              <Badge variant="secondary" className="gap-1">
                                <Check className="h-3 w-3" />
                                Imported
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={async () => {
                                  setImportingCompanyId(company.cwCompanyId);
                                  try {
                                    const result = await api.connectwise.importCompany(company.cwCompanyId);
                                    toast({ title: "Success", description: result.message });
                                    setPreviewCompanies((prev) =>
                                      prev.map((c) =>
                                        c.cwCompanyId === company.cwCompanyId
                                          ? { ...c, alreadyImported: true }
                                          : c
                                      )
                                    );
                                    queryClient.invalidateQueries({ queryKey: ["customers"] });
                                  } catch (error) {
                                    toast({ title: "Import failed", description: String(error), variant: "destructive" });
                                  } finally {
                                    setImportingCompanyId(null);
                                  }
                                }}
                                disabled={importingCompanyId === company.cwCompanyId}
                                data-testid={`button-import-${company.cwCompanyId}`}
                              >
                                {importingCompanyId === company.cwCompanyId ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <Download className="mr-1 h-3 w-3" />
                                )}
                                Import
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewCompanies.length === 0 && !loadingPreview && (
                  <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                    Click "Load Companies" to preview companies from ConnectWise that match your type mappings.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {syncResult && (
            <div className="mt-6">
              <Separator className="mb-4" />
              <h3 className="mb-2 text-lg font-medium">Sync Results</h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <Card className="p-3">
                  <div className="text-2xl font-bold">{syncResult.companiesFound || 0}</div>
                  <div className="text-sm text-muted-foreground">Companies Found</div>
                </Card>
                <Card className="p-3">
                  <div className="text-2xl font-bold text-green-600">{syncResult.companiesImported || 0}</div>
                  <div className="text-sm text-muted-foreground">Imported</div>
                </Card>
                <Card className="p-3">
                  <div className="text-2xl font-bold text-blue-600">{syncResult.companiesUpdated || 0}</div>
                  <div className="text-sm text-muted-foreground">Updated</div>
                </Card>
                <Card className="p-3">
                  <div className="text-2xl font-bold text-yellow-600">{syncResult.companiesSkipped || 0}</div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </Card>
              </div>
              {syncResult.errors && syncResult.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-red-600">Errors ({syncResult.errors.length})</h4>
                  <div className="mt-2 max-h-40 overflow-auto rounded-lg bg-red-50 p-3">
                    {syncResult.errors.map((error: string, i: number) => (
                      <p key={i} className="text-sm text-red-700">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
