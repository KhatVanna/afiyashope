import { LocaleText } from "@/components/i18n/locale-text";

type CatalogErrorMessageProps = {
  className?: string;
};

export function CatalogErrorMessage({ className = "" }: CatalogErrorMessageProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-border bg-muted px-5 py-4 text-center text-sm text-muted-foreground ${className}`}
    >
      <LocaleText
        en="Could not load styles. Please try again."
        km="មិនអាចទាញម៉ូដបានទេ សូមព្យាយាមម្តងទៀត"
      />
    </div>
  );
}
