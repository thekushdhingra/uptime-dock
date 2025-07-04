import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Moon, Sun, CircleDot } from "lucide-react";
import React from "react";

type SidebarLink = {
  icon: React.ReactNode;
  label: string;
  url: string;
};

type SidebarContents = {
  [sectionLabel: string]: SidebarLink[];
};

export function AppSidebar({
  isDark,
  setIsDark,
  sidebarContents,
}: {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarContents: SidebarContents;
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="text-xl font-bold px-4 py-3 flex flex-row">
        <CircleDot className="text-green-500 dark:text-green-400" />
        <span className="text-primary">UptimeDock</span>
      </SidebarHeader>

      <SidebarContent>
        {Object.entries(sidebarContents).map(([sectionLabel, links]) => (
          <SidebarGroup key={sectionLabel}>
            <SidebarGroupLabel>{sectionLabel}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {links.map((link, idx) => (
                  <SidebarMenuItem key={idx}>
                    <a href={link.url}>
                      <SidebarMenuButton
                        className={`${
                          window.location.href
                            .toLowerCase()
                            .endsWith(link.url) && "bg-accent"
                        }`}
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </SidebarMenuButton>
                    </a>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenuButton
          className="flex flex-row items-center justify-center"
          onClick={() => setIsDark((prev) => !prev)}
        >
          {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
