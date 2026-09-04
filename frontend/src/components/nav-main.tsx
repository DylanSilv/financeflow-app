import { type LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
}

/** La raíz sólo está activa en coincidencia exacta; el resto por prefijo. */
function isActivePath(pathname: string, url: string) {
  return url === "/" ? pathname === "/" : pathname.startsWith(url)
}

export function NavMain({
  label,
  items,
}: {
  label?: string
  items: NavItem[]
}) {
  const location = useLocation()

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              className="cursor-pointer"
              isActive={isActivePath(location.pathname, item.url)}
            >
              <Link to={item.url}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
