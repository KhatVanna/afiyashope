type CatalogErrorMessageProps = {
  className?: string;
};

export function CatalogErrorMessage({ className = "" }: CatalogErrorMessageProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-border bg-muted px-5 py-4 text-center text-sm text-muted-foreground ${className}`}
    >
      មិនអាចទាញម៉ូដបានទេ សូមព្យាយាមម្តងទៀត
    </div>
  );
}
