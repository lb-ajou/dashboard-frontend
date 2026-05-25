import { BrowserRouter, Routes, Route } from "react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { Layout } from "@/components/layout/layout"
import { DashboardPage } from "@/pages/dashboard"
import { RoutesPage } from "@/pages/routes"
import { UpstreamsPage } from "@/pages/upstreams"
import { NamespaceEntryPage } from "@/pages/namespace-entry"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
})

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
              <Route path="/" element={<NamespaceEntryPage />} />
              <Route path="/routes" element={<NamespaceEntryPage subpath="routes" />} />
              <Route path="/upstreams" element={<NamespaceEntryPage subpath="upstreams" />} />
              <Route path="/namespaces/:namespace" element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="routes" element={<RoutesPage />} />
                <Route path="upstreams" element={<UpstreamsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
