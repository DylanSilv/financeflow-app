import * as React from "react"

import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

interface SwitchFieldProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  sublabel?: string
  icon?: React.ReactNode
  id?: string
}

/**
 * Fila seleccionable con switch: envuelve el Switch de shadcn con etiqueta,
 * descripción e icono, y hace clickeable toda la fila.
 */
export function SwitchField({ checked, onChange, label, sublabel, icon, id }: SwitchFieldProps) {
  const switchId = id ?? `switch-${label.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <div
      onClick={() => onChange(!checked)}
      className={cn(
        "flex cursor-pointer select-none items-center justify-between rounded-xl border p-4 transition-colors",
        checked
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card hover:border-primary/20"
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className={checked ? "text-foreground" : "text-muted-foreground"} aria-hidden="true">
            {icon}
          </span>
        )}
        <label htmlFor={switchId} className="cursor-pointer">
          <p className="text-sm font-medium">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </label>
      </div>

      <Switch
        id={switchId}
        checked={checked}
        onCheckedChange={onChange}
        onClick={(e) => e.stopPropagation()}
        aria-label={label}
      />
    </div>
  )
}
