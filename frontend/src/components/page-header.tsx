import * as React from "react"

interface PageHeaderProps {
  title: string
  description?: string
  /** Acción principal de la pantalla, alineada a la derecha en escritorio. */
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="self-start md:self-auto">{action}</div>}
    </header>
  )
}
