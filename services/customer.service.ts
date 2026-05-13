import { apiClient } from "@/lib/axios";
import { CustomerInput } from "@/lib/validations";

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  locality: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const customerService = {
  // Get all customers with pagination
  getCustomers: async (
    page: number = 1,
    pageSize: number = 10,
    startDate?: string,
    endDate?: string,
    search?: string,
  ): Promise<PaginatedResponse<Customer>> => {
    const response = await apiClient.get("/api/dashboard/customers", {
      params: {
        page,
        pageSize,
        startDate,
        endDate,
        search: search?.trim() || undefined,
      },
    });
    return response.data;
  },

  // Get customer by ID
  getCustomerById: async (id: number): Promise<Customer> => {
    const response = await apiClient.get(`/api/dashboard/customers/${id}`);
    return response.data.customer;
  },

  // Create customer
  createCustomer: async (data: CustomerInput): Promise<Customer> => {
    const response = await apiClient.post("/api/dashboard/customers", data);
    return response.data.customer;
  },

  // Update customer
  updateCustomer: async (
    id: number,
    data: Partial<CustomerInput>,
  ): Promise<Customer> => {
    const response = await apiClient.patch(`/api/dashboard/customers/${id}`, data);
    return response.data.customer;
  },

  // Delete customer
  deleteCustomer: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/dashboard/customers/${id}`);
  },
};
