import * as React from "react";
import { Download, Palette, Settings2, Upload } from "lucide-react";
import { useTheme } from "next-themes";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfig, useSaveConfig, useStatus } from "@/hooks/use-config";
import {
  buildConfigExport,
  configExportFilename,
  configImportConfirmationMessage,
  parseConfigImport,
} from "@/lib/config-transfer";
import { getWriteAvailability } from "@/lib/write-availability";
import { themeMenuLabel, themeOptions, type ThemeOptionValue } from "@/components/layout/theme-options";

export function SidebarTools() {
  const { data: status } = useStatus();
  const { data: config, isLoading: configLoading, error: configError } = useConfig();
  const saveConfig = useSaveConfig();
  const { theme, setTheme } = useTheme();
  const writeAvailability = getWriteAvailability(status);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importError, setImportError] = React.useState<string | undefined>();

  const handleExport = () => {
    if (!config) {
      return;
    }

    const blob = new Blob([JSON.stringify(buildConfigExport(config), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = configExportFilename();
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setImportError(undefined);

    if (!file || !writeAvailability.canWrite || saveConfig.isPending) {
      return;
    }

    try {
      const request = parseConfigImport(await file.text());
      const confirmed = window.confirm(configImportConfirmationMessage(request));

      if (!confirmed) {
        return;
      }

      saveConfig.mutate(request);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to import configuration.");
    }
  };

  const saveError = saveConfig.error instanceof Error ? saveConfig.error.message : undefined;

  return (
    <div className="space-y-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton type="button" tooltip="Configuration actions">
                <Settings2 className="size-4" />
                <span>Configuration</span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-60">
              <DropdownMenuItem disabled={!config || configLoading} onClick={handleExport}>
                <Upload className="size-4" />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!writeAvailability.canWrite || saveConfig.isPending}
                onClick={handleImportClick}
              >
                <Download className="size-4" />
                {saveConfig.isPending ? "Importing..." : "Import JSON"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton type="button" tooltip={themeMenuLabel}>
                <Palette className="size-4" />
                <span>{themeMenuLabel}</span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-60">
              <DropdownMenuRadioGroup value={(theme ?? "system") as ThemeOptionValue} onValueChange={setTheme}>
                {themeOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    <option.icon className="size-4" />
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
        </SidebarMenuItem>
      </SidebarMenu>
      {configError instanceof Error ? (
        <p className="px-2 text-xs text-destructive group-data-[collapsible=icon]:hidden">{configError.message}</p>
      ) : null}
      {importError ? (
        <p className="px-2 text-xs text-destructive group-data-[collapsible=icon]:hidden">{importError}</p>
      ) : null}
      {saveError ? (
        <p className="px-2 text-xs text-destructive group-data-[collapsible=icon]:hidden">{saveError}</p>
      ) : null}
      {!writeAvailability.canWrite ? (
        <p className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {writeAvailability.reason}
        </p>
      ) : null}
    </div>
  );
}
