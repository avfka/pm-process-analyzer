import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/context/DataContext";
import { MainLayout } from "@/components/layout/MainLayout";

import Dashboard from "@/pages/Dashboard";
import DataUpload from "@/pages/DataUpload";
import ProcessAnalysis from "@/pages/ProcessAnalysis";
import AutomationRating from "@/pages/AutomationRating";
import Recommendations from "@/pages/Recommendations";
import ImpactCalculator from "@/pages/ImpactCalculator";
import MaterialGenerator from "@/pages/MaterialGenerator";
import ToBeModel from "@/pages/ToBeModel";
import Research from "@/pages/Research";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-muted-foreground">Страница не найдена</p>
    </div>
  );
}

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/upload" component={DataUpload} />
        <Route path="/analysis" component={ProcessAnalysis} />
        <Route path="/rating" component={AutomationRating} />
        <Route path="/impact" component={ImpactCalculator} />
        <Route path="/materials" component={MaterialGenerator} />
        <Route path="/to-be" component={ToBeModel} />
        <Route path="/recommendations" component={Recommendations} />
        <Route path="/research" component={Research} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </DataProvider>
    </QueryClientProvider>
  );
}

export default App;
