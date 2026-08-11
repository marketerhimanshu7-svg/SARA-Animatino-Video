import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface SearchableOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onValueChange: (v: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  emptyText?: string;
  size?: "sm" | "md";
}

/**
 * Drop-in replacement for shadcn Select that adds inline search.
 * Trigger matches the visual style of <SelectTrigger> for parity.
 */
export function SearchableSelect({
  value, onValueChange, options, placeholder = "Select", disabled, className, emptyText = "No matches", size = "md",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const selected = options.find((o) => o.value === value);
  const filtered = React.useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())),
    [options, q],
  );
  const triggerCls = cn(
    "flex w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "h-8 text-xs px-2.5 py-1.5" : "h-9",
    !selected && "text-muted-foreground",
    className,
  );

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setQ(""); }}>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className={triggerCls}>
          <span className="line-clamp-1 text-left">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <div className="flex items-center border-b px-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="h-8 border-0 px-1 shadow-none focus-visible:ring-0"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">{emptyText}</div>
          ) : (
            filtered.map((o) => {
              const active = o.value === value;
              return (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => { onValueChange(o.value); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                    active && "bg-accent/60",
                  )}
                >
                  <span className="line-clamp-1 text-left">{o.label}</span>
                  {active && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}