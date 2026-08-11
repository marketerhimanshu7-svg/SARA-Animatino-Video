import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/crm/SearchableSelect";

const SIZES = [10, 20, 30];

export function usePagination<T>(items: T[], initialSize = 10) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(initialSize);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount, page]);
  const paged = useMemo(() => items.slice((page - 1) * size, page * size), [items, page, size]);
  return { page, setPage, size, setSize, pageCount, total, paged };
}

interface Props {
  page: number;
  setPage: (n: number) => void;
  size: number;
  setSize: (n: number) => void;
  pageCount: number;
  total: number;
}

export function Paginator({ page, setPage, size, setSize, pageCount, total }: Props) {
  if (total === 0) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-card px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Rows per page</span>
        <div className="w-20">
          <SearchableSelect
            size="sm"
            value={String(size)}
            onValueChange={(v) => { setSize(Number(v)); setPage(1); }}
            options={SIZES.map((n) => ({ value: String(n), label: String(n) }))}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{from}–{to} of {total}</span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-1 tabular-nums">{page} / {pageCount}</span>
          <Button size="sm" variant="ghost" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}