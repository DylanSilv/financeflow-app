import * as React from "react"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  CreditCard,
  Target,
  TrendingDown,
  CalendarDays,
  Tag,
  Settings,
} from "lucide-react"
import { Link } from "react-router-dom"

import { NavMain, type NavItem } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Movimientos", url: "/transactions", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Cuentas",
    items: [
      { title: "Cuentas", url: "/accounts", icon: Landmark },
      { title: "Tarjetas", url: "/cards", icon: CreditCard },
      { title: "Ahorros", url: "/savings", icon: Target },
    ],
  },
  {
    label: "Compromisos",
    items: [
      { title: "Préstamos", url: "/loans", icon: TrendingDown },
      { title: "Cuentas Fijas", url: "/fixed-expenses", icon: CalendarDays },
    ],
  },
  {
    label: "Organización",
    items: [{ title: "Categorías", url: "/categories", icon: Tag }],
  },
]

const FOOTER_ITEMS: NavItem[] = [
  { title: "Configuración", url: "/settings", icon: Settings },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { name: string; email: string } | null
  onLogout: () => void
  loggingOut: boolean
}

export function AppSidebar({
  user,
  onLogout,
  loggingOut,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-white p-1">
                  <img
                    src="/logo.png"
                    alt="FinTrack"
                    className="size-full rounded object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-base font-bold tracking-tight">
                    FinTrack
                  </span>
                  <span className="text-muted-foreground truncate text-[10px] font-medium tracking-wider uppercase">
                    Personal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group, i) => (
          <NavMain key={group.label ?? i} label={group.label} items={group.items} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavMain items={FOOTER_ITEMS} />
        <SidebarSeparator className="mx-0" />
        <NavUser user={user} onLogout={onLogout} loggingOut={loggingOut} />
      </SidebarFooter>
    </Sidebar>
  )
}
