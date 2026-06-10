import { useEffect, useRef, useState } from "react";
import { Loader2, Paperclip, Trash2, Upload, FileText, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ArchivoItem {
  id: string;
  nombre: string;
  archivo_url: string;
}

interface Props {
  archivos: ArchivoItem[];
  canEdit: boolean;
  bucket?: string;
  folder: string;
  onUpload: (file: { nombre: string; archivo_url: string }) => Promise<void>;
  onDelete: (item: ArchivoItem) => Promise<void>;
  label?: string;
}

const isImage = (name: string) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
const isPdf = (name: string) => /\.pdf$/i.test(name);

export function FileUploader({ archivos, canEdit, bucket = "documentos-csh", folder, onUpload, onDelete, label = "Archivos adjuntos" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ArchivoItem | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!preview) {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
      return;
    }
    let revoked = false;
    let createdUrl: string | null = null;
    setPreviewLoading(true);
    (async () => {
      try {
        const res = await fetch(preview.archivo_url);
        const blob = await res.blob();
        const mime = isPdf(preview.nombre) ? "application/pdf" : blob.type;
        const typed = mime && mime !== blob.type ? new Blob([blob], { type: mime }) : blob;
        createdUrl = URL.createObjectURL(typed);
        if (!revoked) setPreviewBlobUrl(createdUrl);
      } catch {
        if (!revoked) setPreviewBlobUrl(null);
      } finally {
        if (!revoked) setPreviewLoading(false);
      }
    })();
    return () => {
      revoked = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("El archivo supera el tamaño máximo de 20 MB");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setUploading(true);
    const path = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    try {
      await onUpload({ nombre: file.name, archivo_url: pub.publicUrl });
      toast.success("Archivo subido");
    } catch (err: any) {
      toast.error(err.message ?? "Error al guardar");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadFile = async (item: ArchivoItem) => {
    try {
      const res = await fetch(item.archivo_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.open(item.archivo_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">{label}</h4>
        </div>
        {canEdit && (
          <>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx" />
            <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()} className="rounded-xl">
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Subir archivo
            </Button>
          </>
        )}
      </div>
      {canEdit && (
        <p className="text-[11px] text-muted-foreground">Tamaño máximo por archivo: 20 MB.</p>
      )}
      {archivos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">Sin archivos cargados.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border/60">
          {archivos.map((a) => (
            <li key={a.id} className="flex items-center gap-3 p-3">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1 truncate text-sm">{a.nombre}</span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setPreview(a)} title="Ver">
                <Eye className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => downloadFile(a)} title="Descargar">
                <Download className="h-4 w-4" />
              </Button>
              {canEdit && (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => onDelete(a)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{preview?.nombre}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => downloadFile(preview)}>
                  <Download className="mr-2 h-4 w-4" /> Descargar
                </Button>
              </div>
              {isImage(preview.nombre) ? (
                <img src={preview.archivo_url} alt={preview.nombre} className="mx-auto max-h-[70vh] rounded-xl object-contain" />
              ) : isPdf(preview.nombre) ? (
                <iframe src={preview.archivo_url} title={preview.nombre} className="h-[70vh] w-full rounded-xl border" />
              ) : (
                <p className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  Vista previa no disponible para este tipo de archivo. Usa "Descargar" para abrirlo.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
