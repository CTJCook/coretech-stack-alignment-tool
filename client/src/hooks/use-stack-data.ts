import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Customer } from "@shared/schema";
import { useToast } from "./use-toast";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.getAll(),
  });
}

export function useTools() {
  return useQuery({
    queryKey: ["tools"],
    queryFn: () => api.tools.getAll(),
  });
}

export function useBaselines() {
  return useQuery({
    queryKey: ["baselines"],
    queryFn: () => api.baselines.getAll(),
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.getAll(),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => api.customers.getOne(id),
    enabled: !!id,
  });
}

export function useGapReport(id: string) {
  return useQuery({
    queryKey: ["gap-report", id],
    queryFn: () => api.customers.getGapReport(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<Customer, "id">) => api.customers.create(data),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Customer created",
        description: `Added ${customer.name}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Customer, "id">> }) =>
      api.customers.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["gap-report", variables.id] });
    },
  });
}
