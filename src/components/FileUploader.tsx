import { useRef, useState } from "react";
import { Loader2, Paperclip, Trash2, Upload, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function FileUploader({ archivos, canEdit, bucket = "documentos-csh", folder, onUpload, onDelete, label = "Archivos adjuntos" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      {archivos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">Sin archivos cargados.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border/60">
          {archivos.map((a) => (
            <li key={a.id} className="flex items-center gap-3 p-3">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1 truncate text-sm">{a.nombre}</span>
              <a href={a.archivo_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                <ExternalLink className="h-4 w-4" />
              </a>
              {canEdit && (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => onDelete(a)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
