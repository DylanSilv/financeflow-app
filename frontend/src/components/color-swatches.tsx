import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface Swatch {
  /** Lo que se guarda en la DB: puede ser un hex o un nombre de color. */
  value: string
  label: string
  /** Color a pintar. Si no se pasa, se usa `value` como color CSS. */
  color?: string
}

interface ColorSwatchesProps {
  swatches: readonly Swatch[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ColorSwatches({ swatches, value, onChange, className }: ColorSwatchesProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="radiogroup">
      {swatches.map((swatch) => {
        const selected = value === swatch.value
        return (
          <button
            key={swatch.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={swatch.label}
            title={swatch.label}
            onClick={() => onChange(swatch.value)}
            style={{ backgroundColor: swatch.color ?? swatch.value }}
            className={cn(
              "focus-visible:ring-ring flex size-8 items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              "ring-offset-background",
              selected ? "ring-foreground scale-110 ring-2 ring-offset-2" : "opacity-60 hover:opacity-100",
            )}
          >
            {selected && <Check className="size-4 text-white drop-shadow" />}
          </button>
        )
      })}
    </div>
  )
}
