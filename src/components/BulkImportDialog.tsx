import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { productsApi, CsvImportResult } from "@/services/api";
import {
  ArrowUpload24Regular,
  DocumentArrowDown24Regular,
  CheckmarkCircle24Regular,
  Dismiss24Regular,
  Warning24Regular,
  ArrowClockwise24Regular,
} from "@fluentui/react-icons";

interface BulkImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImportDialog({ isOpen, onClose, onSuccess }: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith(".csv") && selected.type !== "text/csv") {
        toast.error("Por favor, selecione um arquivo válido .csv");
        return;
      }
      setFile(selected);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith(".csv") && droppedFile.type !== "text/csv") {
        toast.error("Por favor, selecione um arquivo válido .csv");
        return;
      }
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Selecione um arquivo CSV para importar");
      return;
    }

    setIsUploading(true);
    try {
      const res = await productsApi.importCsv(file);
      setResult(res);
      if (res.imported > 0) {
        toast.success(`${res.imported} produto(s) cadastrado(s) com sucesso!`);
        onSuccess();
      } else {
        toast.warning("Nenhum produto novo foi importado.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao importar arquivo CSV");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "\uFEFFnome,quantidade,preco\nCoca-Cola 350ml,10,5.50\nÁgua Mineral 500ml,50,2.50\nX-Burger,20,18.00\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modelo_produtos_skypdv.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-hidden border-border bg-card sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowUpload24Regular className="h-5 w-5" />
            </div>
            Cadastro de Produtos em Massa (CSV)
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {!result ? (
            <>
              {/* Formato de arquivo e botão de modelo */}
              <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Formato do Arquivo CSV
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="h-7 text-xs text-primary hover:text-primary/80 gap-1.5 p-0"
                  >
                    <DocumentArrowDown24Regular className="h-4 w-4" />
                    Baixar Modelo CSV
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  O arquivo CSV precisa apenas das colunas: <code className="bg-background px-1.5 py-0.5 rounded border border-border text-foreground font-mono">nome</code>, <code className="bg-background px-1.5 py-0.5 rounded border border-border text-foreground font-mono">quantidade</code> e <code className="bg-background px-1.5 py-0.5 rounded border border-border text-foreground font-mono">preco</code>. Se não houver categoria, os produtos serão atribuídos como <code className="bg-background px-1.5 py-0.5 rounded border border-border text-foreground font-mono">Sem Categoria</code>.
                </p>

                <div className="text-[11px] text-muted-foreground bg-background/60 p-2.5 rounded-lg border border-border/50 font-mono">
                  nome,quantidade,preco<br />
                  Coca-Cola 350ml,10,5.50<br />
                  X-Burger,20,18.00
                </div>

                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Warning24Regular className="h-4 w-4 shrink-0" />
                  Produtos com nomes que já existem no seu sistema serão automaticamente ignorados.
                </p>
              </div>

              {/* Upload Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  file
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 bg-secondary/10"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <ArrowUpload24Regular className={`h-8 w-8 mb-2 ${file ? "text-primary" : "text-muted-foreground"}`} />

                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground truncate max-w-[360px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB — Clique ou arraste para trocar
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Clique para selecionar ou arraste o arquivo CSV
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Suporta codificação UTF-8 ou Excel CSV
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Tela de Resultado da Importação */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-2xl">
                    <CheckmarkCircle24Regular className="h-6 w-6" />
                    {result.imported}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    Produtos Cadastrados
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-2xl">
                    <Warning24Regular className="h-6 w-6" />
                    {result.skipped}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    Produtos Ignorados
                  </p>
                </div>
              </div>

              {result.skipped_details && result.skipped_details.length > 0 && (
                <div className="rounded-xl border border-border bg-secondary/10 p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">
                    Detalhes dos Produtos Ignorados ({result.skipped_details.length})
                  </p>
                  <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1 windows-scrollbar">
                    {result.skipped_details.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-background border border-border/50"
                      >
                        <span className="font-medium text-foreground truncate max-w-[280px]">
                          {item.line ? `Linha ${item.line}: ` : ""}{item.name}
                        </span>
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          {item.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex items-center justify-between border-t border-border pt-4">
          {result ? (
            <div className="flex w-full justify-between items-center">
              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                Importar Outro Arquivo
              </Button>
              <Button type="button" size="sm" onClick={handleClose}>
                Concluir
              </Button>
            </div>
          ) : (
            <div className="flex w-full justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isUploading}>
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleImport}
                disabled={!file || isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <ArrowClockwise24Regular className="h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Iniciar Importação"
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
