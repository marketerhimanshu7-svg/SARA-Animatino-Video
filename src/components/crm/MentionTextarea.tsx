import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useCrm } from "@/lib/crm-store";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

/** Lightweight @-mention textarea — autocompletes against active users. */
export function MentionTextarea({ value, onChange, placeholder, rows = 2 }: Props) {
  const { users } = useCrm();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const activeUsers = users.filter((u) => u.active);
  const matches = query
    ? activeUsers.filter((u) => u.fullName.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : activeUsers.slice(0, 6);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    onChange(v);
    const caret = e.target.selectionStart ?? v.length;
    const before = v.slice(0, caret);
    const m = before.match(/@([\w ]*)$/);
    if (m) { setQuery(m[1]); setOpen(true); } else { setOpen(false); setQuery(""); }
  };

  const insertMention = (name: string) => {
    const el = ref.current; if (!el) return;
    const caret = el.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const after = value.slice(caret);
    const replaced = before.replace(/@([\w ]*)$/, `@${name} `);
    onChange(replaced + after);
    setOpen(false); setQuery("");
    setTimeout(() => {
      const pos = replaced.length;
      el.focus(); el.setSelectionRange(pos, pos);
    }, 0);
  };

  return (
    <div className="relative">
      <Textarea ref={ref} value={value} onChange={handleChange} placeholder={placeholder ?? "Type @ to tag a user…"} rows={rows} />
      {open && matches.length > 0 && (
        <div className="absolute z-50 mt-1 w-56 rounded-md border bg-popover p-1 text-sm shadow-md">
          {matches.map((u) => (
            <button key={u.id} type="button" onClick={() => insertMention(u.fullName)}
              className="block w-full rounded px-2 py-1.5 text-left hover:bg-accent">
              <div className="font-medium">{u.fullName}</div>
              <div className="text-[10px] text-muted-foreground">@{u.userName}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}