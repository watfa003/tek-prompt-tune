import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Landing from "./pages/Landing";
import AppPage from "./pages/App";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import UserProfile from "./pages/UserProfile";
import { TemplatesDataProvider } from "./context/TemplatesDataContext";
import ProductFeatures from "./pages/docs/ProductFeatures";
import PromptEngineeringTool from "./pages/docs/PromptEngineeringTool";
import AIModelTesting from "./pages/docs/AIModelTesting";
import Pricing from "./pages/docs/Pricing";
import Documentation from "./pages/docs/Documentation";
import APIReference from "./pages/docs/APIReference";
import PromptTemplates from "./pages/docs/PromptTemplates";

import About from "./pages/docs/About";
import Contact from "./pages/docs/Contact";
import Privacy from "./pages/docs/Privacy";
import Terms from "./pages/docs/Terms";
import APIExamples from "./pages/docs/APIExamples";

// Admin imports
import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";
import { AdminOverview, AdminChangeRequests, AdminAuditLog, AdminDataCollection, AdminLabAnalytics, AdminStrategyPerformance, AdminMasterPrompt, AdminStrategyDefinitions, AdminApprovals, AdminSettings } from "./pages/admin";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useLayoutEffect(() => {
    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.history.scrollRestoration = 'manual';
    
    if (hash) {
      try {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ block: 'start' });
          html.style.scrollBehavior = prevBehavior;
          return;
        }
      } catch {}
    }
    
    window.scrollTo(0, 0);
    html.style.scrollBehavior = prevBehavior;
  }, [pathname, hash]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/user/:username" element={<ProtectedRoute><TemplatesDataProvider><UserProfile /></TemplatesDataProvider></ProtectedRoute>} />
          <Route path="/app/*" element={<ProtectedRoute><AppPage /></ProtectedRoute>} />
          <Route path="/app" element={<ProtectedRoute><AppPage /></ProtectedRoute>} />
          <Route path="/app/generate" element={<ProtectedRoute><AppPage /></ProtectedRoute>} />
          <Route path="/app/history" element={<ProtectedRoute><AppPage /></ProtectedRoute>} />
          <Route path="/app/templates" element={<ProtectedRoute><AppPage /></ProtectedRoute>} />
          <Route path="/app/settings" element={<ProtectedRoute><AppPage /></ProtectedRoute>} />
          
          {/* Admin Routes - Owner Only */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminOverview />} />
            <Route path="data-collection" element={<AdminDataCollection />} />
            <Route path="lab-analytics" element={<AdminLabAnalytics />} />
            <Route path="strategy-performance" element={<AdminStrategyPerformance />} />
            <Route path="change-requests" element={<AdminChangeRequests />} />
            <Route path="master-prompt" element={<AdminMasterPrompt />} />
            <Route path="strategy-definitions" element={<AdminStrategyDefinitions />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="audit-log" element={<AdminAuditLog />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          {/* Documentation Routes */}
          <Route path="/docs/features" element={<ProductFeatures />} />
          <Route path="/docs/engineering" element={<PromptEngineeringTool />} />
          <Route path="/docs/testing" element={<AIModelTesting />} />
          <Route path="/docs/pricing" element={<Pricing />} />
          <Route path="/docs/documentation" element={<Documentation />} />
          <Route path="/docs/api" element={<APIReference />} />
          <Route path="/docs/api-examples" element={<APIExamples />} />
          <Route path="/docs/templates" element={<PromptTemplates />} />
          
          <Route path="/docs/about" element={<About />} />
          <Route path="/docs/contact" element={<Contact />} />
          <Route path="/docs/privacy" element={<Privacy />} />
          <Route path="/docs/terms" element={<Terms />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
