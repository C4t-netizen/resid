import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs = [], actions, badge }: PageHeaderProps) {
  return (
    <div className="animate-fade-in border-b border-border/60 bg-gradient-card">
      <div className="px-4 py-6 md:px-8 md:py-8">
        {breadcrumbs.length > 0 && (
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-smooth">
              <Home className="h-3.5 w-3.5" />
            </Link>
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5" />
                {b.href ? (
                  <Link to={b.href} className="hover:text-foreground transition-smooth">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
