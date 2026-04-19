import { Construction } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} subtitle="Este módulo estará disponible próximamente." breadcrumbs={[{ label: title }]} />
      <div className="px-4 py-12 md:px-8">
        <Card className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border-dashed border-border bg-gradient-card p-12 text-center shadow-soft">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Construction className="h-8 w-8 text-primary-foreground" />
          </div>
          <h3 className="mt-6 font-display text-xl font-bold">En construcción</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Estamos preparando este módulo. Mientras tanto, puedes explorar los demás disponibles.
          </p>
          <Button asChild className="mt-6 rounded-xl bg-gradient-primary">
            <Link to="/modulos">Ver módulos disponibles</Link>
          </Button>
        </Card>
      </div>
    </>
  );
}
