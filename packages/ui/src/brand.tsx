export type OrderFlowBrandProps = {
  subtitle?: string;
};

export function OrderFlowBrand({ subtitle }: OrderFlowBrandProps) {
  return (
    <div>
      <div className="text-xl font-semibold tracking-tight">OrderFlow</div>
      {subtitle ? <div className="text-sm text-foreground-500">{subtitle}</div> : null}
    </div>
  );
}
