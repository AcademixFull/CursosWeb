import { useQuery } from "@tanstack/react-query";
import { listCategories } from "../services/categories.service";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    networkMode: "always",
    refetchOnReconnect: "always",
    staleTime: 5 * 60_000,
  });
}
