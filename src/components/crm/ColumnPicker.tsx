import { useEffect, useState } from "react";
import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ColumnDef { key: string; label: string; }

export function useVisibleColumns(storageKey: string, defaults: string[]) {
  const [visible, setVisible] = useState<string[]>(defaults);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(`cols:${storageKey}`);
      if (raw) setVisible(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [storageKey]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(`cols:${storageKey}`, JSON.stringify(visible)); } catch { /* ignore */ }
  }, [storageKey, visible]);
  const isVisible = (k: string) => visible.includes(k);
  return { visible, setVisible, isVisible };
}

export function ColumnPicker({ columns, visible, setVisible }: {
  columns: ColumnDef[]; visible: string[]; setVisible: (v: string[]) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm"><Columns3 className="mr-1 h-3.5 w-3.5" />Columns</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {columns.map((c) => (
            <label key={c.key} className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent">
              <Checkbox
                checked={visible.includes(c.key)}
                onCheckedChange={(v) =>
                  setVisible(v ? Array.from(new Set([...visible, c.key])) : visible.filter((k) => k !== c.key))
                }
              />
              {c.label}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}