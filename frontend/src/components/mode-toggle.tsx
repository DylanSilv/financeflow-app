import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"

interface ModeToggleProps {
  variant?: "outline" | "ghost" | "default"
}

export function ModeToggle({ variant = "ghost" }: ModeToggleProps) {
  const { theme, setTheme } = useTheme()

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="cursor-pointer"
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">
        Cambiar a modo {isDark ? "claro" : "oscuro"}
      </span>
    </Button>
  )
}
