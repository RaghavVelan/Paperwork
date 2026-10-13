import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoriesFor } from "@/lib/finance/categories";
import { useFinanceStore } from "@/lib/finance/store";
import type { TxType } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export function CategoryPicker({
  type,
  value,
  onChange,
}: {
  type: TxType;
  value: string;
  onChange: (id: string) => void;
}) {
  const custom = useFinanceStore((s) => s.categories);
  const addCategory = useFinanceStore((s) => s.addCategory);
  const cats = categoriesFor(type, custom);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  function save(event: FormEvent) {
    event.preventDefault();
    const created = addCategory(name, type);
    if (!created) {
      toast.error(name.trim() ? "You already have that category." : "Name the category.");
      return;
    }
    onChange(created.id);
    setName("");
    setAdding(false);
  }

  return (
    <div className="mt-1.5 mb-5">
      <div className="grid grid-cols-4 gap-2">
        {cats.map((c) => {
          const active = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center",
                active ? "bg-accent text-accent-fg" : "bg-raised text-muted shadow-card",
              )}
            >
              <CategoryIcon id={c.id} className="size-4" />
              <span className="line-clamp-2 text-2xs font-medium leading-tight">{c.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl bg-raised px-1 py-2 text-center text-muted shadow-card"
        >
          <Plus className="size-4" strokeWidth={1.75} />
          <span className="text-2xs font-medium leading-tight">New</span>
        </button>
      </div>
      {adding ? (
        <form onSubmit={save} className="mt-3 flex items-center gap-2">
          <Input
            autoFocus
            value={name}
            maxLength={24}
            placeholder={type === "expense" ? "Expense category" : "Income category"}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" size="sm">
            Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setAdding(false);
              setName("");
            }}
          >
            Cancel
          </Button>
        </form>
      ) : null}
    </div>
  );
}
