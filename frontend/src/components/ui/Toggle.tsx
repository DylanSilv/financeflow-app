interface ToggleProps {
  checked:   boolean;
  onChange:  (v: boolean) => void;
  label:     string;       // texto visible
  sublabel?: string;       // descripción secundaria
  icon?:     React.ReactNode;
  id?:       string;
}

export function Toggle({ checked, onChange, label, sublabel, icon, id }: ToggleProps) {
  const switchId = id ?? `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all select-none ${
        checked
          ? 'bg-indigo-500/10 border-indigo-500/30'
          : 'bg-[#161616] border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className={checked ? 'text-indigo-400' : 'text-zinc-500'} aria-hidden="true">
            {icon}
          </span>
        )}
        <label htmlFor={switchId} className="cursor-pointer">
          <p className="text-sm font-medium text-white">{label}</p>
          {sublabel && <p className="text-xs text-zinc-500">{sublabel}</p>}
        </label>
      </div>

      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        onClick={e => { e.stopPropagation(); onChange(!checked); }}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          checked ? 'bg-indigo-500' : 'bg-zinc-700'
        }`}
      >
        <span className="sr-only">{label}</span>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
