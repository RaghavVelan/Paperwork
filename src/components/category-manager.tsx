import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { categoriesFor } from "@/lib/finance/categories";
import { useFinanceStore } from "@/lib/finance/store";
import { useSettings } from "@/lib/ledger/use-settings";
import { groupDigits, parseAmountInput } from "@/lib/money";

export function CategoryManager() {
  const custom = useFinanceStore((s) => s.categories);
  const budgets = useFinanceStore((s) => s.profile.categoryBudgets);
  const renameCategory = useFinanceStore((s) => s.renameCategory);
  const deleteCategory = useFinanceStore((s) => s.deleteCategory);
  const updateProfile = useFinanceStore((s) => s.updateProfile);
  const { currency } = useSettings();
  const [capId, setCapId] = useState("food");
  const [capAmount, setCapAmount] = useState("");

  const expenseCats = categoriesFor("expense", custom);
  const caps = Object.entries(budgets).filter(([, amount]) => amount > 0);

  function saveCap() {
    const amount = Math.max(0, Math.round(parseAmountInput(capAmount)));
    if (amount <= 0) {
      toast.error("Enter a cap greater than zero.");
      return;
    }
    updateProfile({ categoryBudgets: { ...budgets, [capId]: amount } });
    setCapAmount("");
    toast.success("Category cap saved");
  }

  function clearCap(id: string) {
    const next = { ...budgets };
    delete next[id];
    updateProfile({ categoryBudgets: next });
  }

  return (
    <div className="flex flex-col gap-5">
      {custom.length > 0 ? (
        <div>
          <Label>Your categories</Label>
          <ul className="mt-1.5 flex flex-col gap-2">
            {custom.map((cat) => (
              <li key={cat.id} className="rounded-2xl bg-raised p-3">
                <form
                  className="flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const next = String(data.get("label") ?? "");
                    if (!renameCategory(cat.id, next)) toast.error("That name is empty or already used.");
                    else toast.success("Category renamed");
                  }}
                >
                  <Input name="label" defaultValue={cat.label} maxLength={24} aria-label={`Rename ${cat.label}`} />
                  <Button type="submit" size="sm" variant="secondary">
                    Rename
                  </Button>
                </form>
                <button
                  type="button"
                  className="mt-2 text-xs text-muted"
                  onClick={() => {
                    deleteCategory(cat.id);
                    toast.success("Category removed. Its entries moved to Other.");
                  }}
                >
                  Remove · entries move to Other
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <Label>Category caps</Label>
        <p className="mt-1.5 text-xs text-muted">Optional. The monthly cap still covers everything.</p>
        {caps.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-1">
            {caps.map(([id, amount]) => (
              <li key={id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-fg">{expenseCats.find((c) => c.id === id)?.label ?? id}</span>
                <button type="button" className="text-xs text-muted" onClick={() => clearCap(id)}>
                  {groupDigits(String(amount), currency)} · remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-2 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Select value={capId} onChange={(e) => setCapId(e.target.value)} aria-label="Category for cap">
              {expenseCats.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </div>
          <Input
            className="w-24 shrink-0"
            inputMode="numeric"
            placeholder="Cap"
            aria-label="Category cap"
            value={groupDigits(capAmount, currency)}
            onChange={(e) => setCapAmount(e.target.value.replace(/[^\d]/g, ""))}
          />
          <Button type="button" size="sm" variant="secondary" className="shrink-0" onClick={saveCap}>
            Set
          </Button>
        </div>
      </div>
    </div>
  );
}
