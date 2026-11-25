"use client";

import { useCallback } from "react";
import {
  formatMoneyForCurrency,
  formatMoneyForRegion,
  useRegionStore,
} from "@/stores/region-store";
import type { ProductCurrency } from "@/data/demo-catalog.types";

export function useFormatMoney() {
  const region = useRegionStore((state) => state.region());

  return useCallback(
    (amount: number, currency?: ProductCurrency | null) =>
      currency
        ? formatMoneyForCurrency(amount, currency, region)
        : formatMoneyForRegion(amount, region),
    [region]
  );
}
