import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/layout/layout";
import { AppEntryPage } from "@/pages/app-entry";
import { SetupPage } from "@/pages/setup";
import { OverviewPage } from "@/pages/overview";
import { RoutesPage } from "@/pages/routes";
import { UpstreamsPage } from "@/pages/upstreams";
import { NodePage } from "@/pages/node";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="proxy-admin-theme"
      >
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppEntryPage />} />
              <Route path="/setup" element={<SetupPage />} />
              <Route element={<Layout />}>
                <Route path="/overview" element={<OverviewPage />} />
                <Route path="/routes" element={<RoutesPage />} />
                <Route path="/upstreams" element={<UpstreamsPage />} />
                <Route path="/node" element={<NodePage />} />
                <Route path="/cluster" element={<Navigate to="/node" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
