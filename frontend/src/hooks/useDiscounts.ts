import { useState, useEffect, useCallback } from "react";
import { discountApi } from "@/services/api.service";

export interface DiscountDto {
  id: string;
  code: string;
  percentOff?: number | null;
  amountOff?: number | null;
  isAdminBackdoor: boolean;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string | null;
  maxUsageCount?: number | null;
  usageCount: number;
}

export function useDiscounts() {
  const [discounts, setDiscounts] = useState<DiscountDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDiscounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await discountApi.getAllAdmin();
      setDiscounts(data);
    } catch (err) {
      console.warn("Failed to load discounts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDiscounts();
  }, [fetchDiscounts]);

  const createDiscount = async (data: Partial<DiscountDto>) => {
    await discountApi.create(data);
    await fetchDiscounts();
  };

  const updateDiscount = async (id: string, data: Partial<DiscountDto>) => {
    await discountApi.update(id, data);
    await fetchDiscounts();
  };

  const deleteDiscount = async (id: string) => {
    await discountApi.delete(id);
    await fetchDiscounts();
  };

  return {
    discounts,
    isLoading,
    fetchDiscounts,
    createDiscount,
    updateDiscount,
    deleteDiscount,
  };
}
