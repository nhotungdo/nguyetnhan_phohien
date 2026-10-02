import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const { data: discounts = [], isLoading, refetch: fetchDiscounts } = useQuery({
    queryKey: ["discounts", "admin"],
    queryFn: () => discountApi.getAllAdmin()
  });

  const createDiscount = async (data: Partial<DiscountDto>) => {
    await discountApi.create(data);
    queryClient.invalidateQueries({ queryKey: ["discounts", "admin"] });
  };

  const updateDiscount = async (id: string, data: Partial<DiscountDto>) => {
    await discountApi.update(id, data);
    queryClient.invalidateQueries({ queryKey: ["discounts", "admin"] });
  };

  const deleteDiscount = async (id: string) => {
    await discountApi.delete(id);
    queryClient.invalidateQueries({ queryKey: ["discounts", "admin"] });
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
