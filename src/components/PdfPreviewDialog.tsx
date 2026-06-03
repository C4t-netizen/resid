import { useEffect, useState } from "react";
import type jsPDF from "jspdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface PdfPreviewState {
  doc: jsPDF;
  filename: string;
}

export function usePdfPreview() {
  const [preview, setPreview] = useState<PdfPreviewState | null>(null);
  const openPdfPreview = (doc: jsPDF, filename: string) => setPreview({ doc, filename });
  const dialog = (
    <PdfPreviewDialog
      state={preview}
      onClose={() => setPreview(null)}
    />
  );
  return { openPdfPreview, PdfPreviewDialogElement: dialog };
}

interface Props {
  state: PdfPreviewState | null;
  onClose: () => void;
}

export function PdfPreviewDialog({ state, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!state) {
      setUrl(null);
      return;
    }
    // Use data URI instead of blob URL to avoid Chrome blocking
    // blob: PDFs inside sandboxed/cross-origin iframes (preview environments).
    const dataUri = state.doc.output("datauristring");
    setUrl(dataUri);
  }, [state]);

  const handleDownload = () => {
    if (state) state.doc.save(state.filename);
  };

  return (
    <Dialog open={!!state} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-display">
            Vista previa: {state?.filename ?? ""}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Revisa el documento antes de descargarlo. Si encuentras errores, cierra esta ventana y corrige los datos.
          </p>
        </DialogHeader>
        <div className="flex-1 px-6 overflow-hidden">
          {url && (
            <iframe
              src={url}
              title="Vista previa PDF"
              className="h-full w-full rounded-lg border border-border/60 bg-muted"
            />
          )}
        </div>
        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Cerrar
          </Button>
          <Button onClick={handleDownload} className="bg-gradient-primary">
            <Download className="mr-2 h-4 w-4" /> Descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
