"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Calendar, FolderClosed, Archive, Settings, Home, BarChart3 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      title: "Hoy",
      icon: Home,
      href: "/hoy",
      shortcut: "H",
    },
    {
      title: "Calendario",
      icon: Calendar,
      href: "/calendar",
      shortcut: "⌘+1",
    },
    {
      title: "Proyectos",
      icon: FolderClosed,
      href: "/projects",
      shortcut: "⌘+2",
    },
    {
      title: "Notas",
      icon: Archive,
      href: "/notas",
      shortcut: "⌘+3",
    },
    {
      title: "Insights",
      icon: BarChart3,
      href: "/insights",
      shortcut: "⌘+4",
    },
    {
      title: "Ajustes",
      icon: Settings,
      href: "/settings",
      shortcut: "⌘+,",
    },
  ];

  return (
    <Sidebar className="border-r border-border" data-oid=".vw7li_">
      <SidebarContent data-oid="iiqz.lm">
        <SidebarMenu data-oid="izcw-63">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href} data-oid="aw88flo">
              <SidebarMenuButton
                asChild
                isActive={
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                }
                tooltip={`${item.title} (${item.shortcut})`}
                data-oid="_32g.fd"
              >
                <Link
                  href={item.href}
                  className="flex items-center"
                  data-oid="tdo0tch"
                >
                  <item.icon className="h-5 w-5" data-oid="dn4pcwm" />
                  <span className="ml-2" data-oid="o5e0co.">
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
