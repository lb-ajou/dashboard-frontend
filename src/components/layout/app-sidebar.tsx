import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { ChevronDown, GitBranch, LayoutDashboard, Route, Server } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCreateNamespace, useNamespaces } from "@/hooks/use-config"
import { namespacePath, useCurrentNamespace } from "@/hooks/use-namespace"
import { INVALID_NAMESPACE_MESSAGE, isValidNamespaceName } from "@/lib/namespaces"

const mainNavItems = [
  {
    title: "Dashboard",
    subpath: "",
    icon: LayoutDashboard,
  },
  {
    title: "Routes",
    subpath: "routes",
    icon: Route,
  },
  {
    title: "Upstream Pools",
    subpath: "upstreams",
    icon: Server,
  },
  {
    title: "Cluster",
    subpath: "cluster",
    icon: GitBranch,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const navigate = useNavigate()
  const currentNamespace = useCurrentNamespace()
  const { data: namespaceData, isLoading: isLoadingNamespaces } = useNamespaces()
  const createNamespace = useCreateNamespace()
  const namespaceBasePath = namespacePath(currentNamespace)
  const currentSubpath = location.pathname.startsWith(namespaceBasePath)
    ? location.pathname.slice(namespaceBasePath.length).replace(/^\/+/, "")
    : ""

  const handleNamespaceChange = (namespace: string) => {
    navigate(namespacePath(namespace, currentSubpath))
  }

  const handleCreateNamespace = () => {
    const nextNamespace = window.prompt("Enter a namespace name")
    const trimmedNamespace = nextNamespace?.trim()

    if (!trimmedNamespace) {
      return
    }

    if (!isValidNamespaceName(trimmedNamespace)) {
      window.alert(INVALID_NAMESPACE_MESSAGE)
      return
    }

    createNamespace.mutate(trimmedNamespace, {
      onSuccess: (createdNamespace) => {
        navigate(namespacePath(createdNamespace.namespace, currentSubpath))
      },
      onError: (error) => {
        window.alert(error.message)
      },
    })
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Server className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{currentNamespace}</span>
                    <span className="truncate text-xs text-muted-foreground">Namespace</span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="start"
                sideOffset={4}
              >
                {isLoadingNamespaces ? <DropdownMenuItem disabled>Loading namespaces...</DropdownMenuItem> : null}
                {namespaceData?.items.map((item) => (
                  <DropdownMenuItem
                    key={item.namespace}
                    onClick={() => handleNamespaceChange(item.namespace)}
                  >
                    <div className="flex flex-col">
                      <span>{item.namespace}</span>
                      <span className="text-xs text-muted-foreground">{item.path}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCreateNamespace} disabled={createNamespace.isPending}>
                  {createNamespace.isPending ? "Creating..." : "Create Namespace"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === namespacePath(currentNamespace, item.subpath)}
                  >
                    <Link to={namespacePath(currentNamespace, item.subpath)}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
