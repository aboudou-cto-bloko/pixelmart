// filepath: src/components/products/organisms/CsvImportDialog.tsx

"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CsvDropzone } from "../molecules/CsvDropzone";
import { Download, AlertCircle, CheckCircle2 } from "lucide-react";

interface ParsedRow {
  title: string;
  description: string;
  short_description?: string;
  category_id: string;
  tags: string;
  price: string;
  compare_price?: string;
  cost_price?: string;
  sku?: string;
  track_inventory: string;
  quantity: string;
  low_stock_threshold?: string;
  weight?: string;
  is_digital: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

type ImportPhase = "upload" | "preview" | "importing" | "done";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryMap: Map<string, string>; // slug → Id<"categories">
}

const BATCH_SIZE = 100;

const CSV_TEMPLATE_HEADER =
  "title,description,short_description,category_slug,tags,price,compare_price,cost_price,sku,track_inventory,quantity,low_stock_threshold,weight,is_digital";

function downloadTemplate() {
  const exampleRow =
    '"Robe africaine","Une magnifique robe en wax","Robe wax colorée","mode","mode,wax,afrique",15000,,8000,SKU-001,true,50,5,200,false';
  const csv = `${CSV_TEMPLATE_HEADER}\n${exampleRow}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pixelmart-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvImportDialog({
  open,
  onOpenChange,
  categoryMap,
}: CsvImportDialogProps) {
  const importBatch = useMutation(api.products.csvImport.importBatch);

  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<ImportPhase>("upload");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setPhase("upload");
    setParsedRows([]);
    setErrors([]);
    setProgress(0);
    setImportResult(null);
  }, []);

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      setFile(selectedFile);

      Papa.parse<ParsedRow>(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data;
          const validationErrors: ValidationError[] = [];

          rows.forEach((row, i) => {
            if (!row.title?.trim()) {
              validationErrors.push({
                row: i + 2,
                field: "title",
                message: "Titre requis",
              });
            }
            if (!row.description?.trim()) {
              validationErrors.push({
                row: i + 2,
                field: "description",
                message: "Description requise",
              });
            }
            const catSlug = (row as unknown as Record<string, string>)
              .category_slug;
            if (!catSlug || !categoryMap.has(catSlug)) {
              validationErrors.push({
                row: i + 2,
                field: "category_slug",
                message: `Catégorie "${catSlug}" inconnue`,
              });
            }
            const price = Number(row.price);
            if (isNaN(price) || price <= 0) {
              validationErrors.push({
                row: i + 2,
                field: "price",
                message: "Prix invalide",
              });
            }
          });

          setParsedRows(rows);
          setErrors(validationErrors);
          setPhase("preview");
        },
        error: () => {
          setErrors([
            {
              row: 0,
              field: "file",
              message: "Impossible de lire le fichier CSV",
            },
          ]);
          setPhase("preview");
        },
      });
    },
    [categoryMap],
  );

  const handleImport = useCallback(async () => {
    setPhase("importing");
    setProgress(0);

    // Filtrer les lignes valides (pas dans les erreurs de validation)
    const errorRows = new Set(errors.map((e) => e.row - 2));
    const validRows = parsedRows.filter((_, i) => !errorRows.has(i));

    if (validRows.length === 0) return;

    let totalSuccess = 0;
    let totalFailed = 0;

    // Envoyer par lots de BATCH_SIZE
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);

      const products = batch.map((row) => {
        const catSlug = (row as unknown as Record<string, string>)
          .category_slug;
        return {
          title: row.title.trim(),
          description: row.description.trim(),
          short_description: row.short_description?.trim() || undefined,
          category_id: categoryMap.get(catSlug)! as Id<"categories">,
          tags: row.tags
            ? row.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
          price: Math.round(Number(row.price)),
          compare_price: row.compare_price
            ? Math.round(Number(row.compare_price))
            : undefined,
          cost_price: row.cost_price
            ? Math.round(Number(row.cost_price))
            : undefined,
          sku: row.sku?.trim() || undefined,
          track_inventory: row.track_inventory?.toLowerCase() === "true",
          quantity: Math.max(0, Math.round(Number(row.quantity) || 0)),
          low_stock_threshold: row.low_stock_threshold
            ? Math.round(Number(row.low_stock_threshold))
            : undefined,
          weight: row.weight ? Math.round(Number(row.weight)) : undefined,
          is_digital: row.is_digital?.toLowerCase() === "true",
        };
      });

      try {
        const result = await importBatch({ products });
        totalSuccess += result.successCount;
        totalFailed += result.failCount;
      } catch (_err) {
        totalFailed += batch.length;
      }

      setProgress(Math.round(((i + batch.length) / validRows.length) * 100));
    }

    setImportResult({
      success: totalSuccess,
      failed: totalFailed + errors.length,
    });
    setPhase("done");
  }, [parsedRows, errors, categoryMap, importBatch]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer des produits</DialogTitle>
          <DialogDescription>
            Importez vos produits via un fichier CSV. Tous seront créés en
            brouillon.
          </DialogDescription>
        </DialogHeader>

        {/* Phase : Upload */}
        {phase === "upload" && (
          <div className="space-y-4">
            <CsvDropzone
              onFileSelect={handleFileSelect}
              onClear={() => setFile(null)}
              selectedFile={file}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Télécharger le modèle CSV
            </Button>
          </div>
        )}

        {/* Phase : Preview */}
        {phase === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline">
                {parsedRows.length} ligne{parsedRows.length > 1 ? "s" : ""}
              </Badge>
              {errors.length > 0 && (
                <Badge variant="destructive">
                  {errors.length} erreur{errors.length > 1 ? "s" : ""}
                </Badge>
              )}
              {parsedRows.length - errors.length > 0 && (
                <Badge
                  className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  variant="outline"
                >
                  {parsedRows.length - errors.length} valide
                  {parsedRows.length - errors.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            {errors.length > 0 && (
              <div className="max-h-40 overflow-auto rounded-md border p-3 space-y-1">
                {errors.slice(0, 20).map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <span>
                      Ligne {err.row} —{" "}
                      <span className="font-medium">{err.field}</span>:{" "}
                      {err.message}
                    </span>
                  </div>
                ))}
                {errors.length > 20 && (
                  <p className="text-xs text-muted-foreground">
                    … et {errors.length - 20} autres erreurs
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Phase : Importing */}
        {phase === "importing" && (
          <div className="space-y-3 py-4">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              Import en cours… {progress}%
            </p>
          </div>
        )}

        {/* Phase : Done */}
        {phase === "done" && importResult && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <div className="text-center">
              <p className="text-sm font-medium">Import terminé</p>
              <p className="text-xs text-muted-foreground">
                {importResult.success} produit
                {importResult.success > 1 ? "s" : ""} importé
                {importResult.success > 1 ? "s" : ""}
                {importResult.failed > 0 &&
                  ` — ${importResult.failed} échec${importResult.failed > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {phase === "preview" && (
            <>
              <Button variant="outline" onClick={reset}>
                Retour
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  parsedRows.length === 0 || parsedRows.length === errors.length
                }
              >
                Importer {parsedRows.length - errors.length} produit
                {parsedRows.length - errors.length > 1 ? "s" : ""}
              </Button>
            </>
          )}
          {phase === "done" && (
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
