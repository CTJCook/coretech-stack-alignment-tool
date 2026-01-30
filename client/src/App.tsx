import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import StackTracker from "./pages/stack-tracker";
import AdminPortal from "./pages/admin-portal";
import Dashboard from "./pages/dashboard";
import ConnectwiseAdmin from "./pages/connectwise-admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={StackTracker} />
      <Route path="/admin" component={AdminPortal} />
      <Route path="/admin/connectwise" component={ConnectwiseAdmin} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
