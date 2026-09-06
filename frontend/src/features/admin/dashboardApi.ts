import { api } from "../../lib/api";

export interface RecentOrderRow {
  id: string;
  publicReference: string;
  status: string;
  customerName: string;
  grandTotal: number;
  createdAt: string;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  awaitingProcessing: number;
  lowStockVariants: number;
  recentOrders: RecentOrderRow[];
  salesTimeSeries: SalesDataPoint[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { data } = await api.get<DashboardMetrics>("/admin/dashboard");
  return data;
}
