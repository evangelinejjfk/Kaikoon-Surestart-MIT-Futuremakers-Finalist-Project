import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCollectibles } from "../endpoints/collectibles_GET.schema";
import { postCollectiblesPurchase, InputType as PurchaseInput } from "../endpoints/collectibles/purchase_POST.schema";
import { getUserCollection } from "../endpoints/collectibles/user-collection_GET.schema";
import { toast } from "sonner";

export const useCollectibles = () => {
  return useQuery({
    queryKey: ["collectibles"],
    queryFn: () => getCollectibles(),
  });
};

export const useUserCollection = () => {
  return useQuery({
    queryKey: ["userCollection"],
    queryFn: () => getUserCollection(),
  });
};

export const usePurchaseCollectible = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (purchaseData: PurchaseInput) => postCollectiblesPurchase(purchaseData),
    onSuccess: (data, variables) => {
      toast.success("Purchase successful! ✨");
      // Invalidate and refetch data that has changed
      queryClient.invalidateQueries({ queryKey: ["userCollection"] });
      queryClient.invalidateQueries({ queryKey: ["userProgress"] });
    },
    onError: (error) => {
      toast.error(`Purchase failed: ${error.message}`);
    },
  });
};