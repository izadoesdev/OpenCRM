"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useImportLeads } from "@/lib/queries";

export function CsvImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const importMut = useImportLeads();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) {
        setError("CSV must have a header row and at least one data row");
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      if (!(headers.includes("name") && headers.includes("email"))) {
        setError("CSV must have 'name' and 'email' columns");
        return;
      }
      const parsed = lines
        .slice(1)
        .map((line) => {
          const cols = line.split(",").map((c) => c.trim());
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => {
            obj[h] = cols[i] ?? "";
          });
          return obj;
        })
        .filter((r) => r.name && r.email);
      setRows(parsed);
    };
    reader.readAsText(file);
  }

  function handleImport() {
    const mapped = rows.map((r) => ({
      name: r.name,
      email: r.email,
      company: r.company || undefined,
      title: r.title || undefined,
      phone: r.phone || undefined,
      website: r.website || undefined,
      source: r.source || undefined,
      value: r.value ? Math.round(Number.parseFloat(r.value) * 100) : undefined,
    }));
    importMut.mutate(mapped, {
      onSuccess: () => {
        onOpenChange(false);
        setRows([]);
      },
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: name, email, company, title, phone,
            website, source, value
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <input
            accept=".csv"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:font-medium file:text-foreground file:text-sm"
            onChange={handleFile}
            type="file"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {rows.length > 0 && (
            <div className="rounded-md border p-3">
              <p className="text-sm">
                {rows.length} lead{rows.length === 1 ? "" : "s"} ready to import
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                Preview:{" "}
                {rows
                  .slice(0, 3)
                  .map((r) => r.name)
                  .join(", ")}
                {rows.length > 3 && ` and ${rows.length - 3} more`}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              disabled={rows.length === 0 || importMut.isPending}
              onClick={handleImport}
              size="sm"
            >
              {importMut.isPending
                ? "Importing..."
                : `Import ${rows.length} Leads`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
