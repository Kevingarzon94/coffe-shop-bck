import { supabase } from '../../config/supabase';
import { AppError } from '../../shared/utils/AppError';

/**
 * Dashboard summary type
 */
interface DashboardSummary {
  totalRevenue: number;
  totalSales: number;
  averageSale: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
}

/**
 * Top product type
 */
interface TopProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  totalQuantitySold: number;
  totalRevenue: number;
  timesSold: number;
}

/**
 * Top customer type
 */
interface TopCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  totalPurchases: number;
  totalSpent: number;
  averagePurchase: number;
  lastPurchaseDate: string;
}

/**
 * Low stock product type
 */
interface LowStockProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sales chart data point
 */
interface SalesChartDataPoint {
  date: string;
  totalSales: number;
  totalRevenue: number;
}

/**
 * Get dashboard summary with key metrics
 */
export async function getSummary(): Promise<DashboardSummary> {
  // Get revenue summary from view
  const { data: revenue, error: revenueError } = await supabase
    .from('v_revenue_summary')
    .select('*')
    .single();

  if (revenueError) {
    console.error('Error fetching revenue summary:', revenueError);
    throw AppError.internal('Failed to fetch revenue summary');
  }

  // Count total customers
  const { count: totalCustomers, error: customersError } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  if (customersError) {
    console.error('Error counting customers:', customersError);
    throw AppError.internal('Failed to count customers');
  }

  // Count active products
  const { count: totalProducts, error: productsError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (productsError) {
    console.error('Error counting products:', productsError);
    throw AppError.internal('Failed to count products');
  }

  // Count low stock products
  const { count: lowStockCount, error: lowStockError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .lt('stock', 5);

  if (lowStockError) {
    console.error('Error counting low stock products:', lowStockError);
    throw AppError.internal('Failed to count low stock products');
  }

  return {
    totalRevenue: parseFloat(revenue.total_revenue || 0),
    totalSales: parseInt(revenue.total_sales || 0, 10),
    averageSale: parseFloat(revenue.average_sale || 0),
    totalCustomers: totalCustomers || 0,
    totalProducts: totalProducts || 0,
    lowStockCount: lowStockCount || 0,
  };
}

/**
 * Get top products by revenue
 */
export async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  const { data, error } = await supabase
    .from('v_top_products')
    .select('*')
    .limit(limit);

  if (error) {
    console.error('Error fetching top products:', error);
    throw AppError.internal('Failed to fetch top products');
  }

  return (data || []).map((product: any) => ({
    id: product.id,
    name: product.name,
    price: parseFloat(product.price),
    stock: product.stock,
    imageUrl: product.image_url,
    totalQuantitySold: product.total_quantity_sold,
    totalRevenue: parseFloat(product.total_revenue),
    timesSold: product.times_sold,
  }));
}

/**
 * Get top customers by spending
 */
export async function getTopCustomers(limit = 10): Promise<TopCustomer[]> {
  const { data, error } = await supabase
    .from('v_top_customers')
    .select('*')
    .limit(limit);

  if (error) {
    console.error('Error fetching top customers:', error);
    throw AppError.internal('Failed to fetch top customers');
  }

  return (data || []).map((customer: any) => ({
    id: customer.id,
    firstName: customer.first_name,
    lastName: customer.last_name,
    email: customer.email,
    totalPurchases: customer.total_purchases,
    totalSpent: parseFloat(customer.total_spent),
    averagePurchase: parseFloat(customer.average_purchase),
    lastPurchaseDate: customer.last_purchase_date,
  }));
}

/**
 * Get products with low stock (less than 5 units)
 */
export async function getLowStockProducts(): Promise<LowStockProduct[]> {
  const { data, error } = await supabase
    .from('v_low_stock_products')
    .select('*');

  if (error) {
    console.error('Error fetching low stock products:', error);
    throw AppError.internal('Failed to fetch low stock products');
  }

  return (data || []).map((product: any) => ({
    id: product.id,
    name: product.name,
    price: parseFloat(product.price),
    stock: product.stock,
    imageUrl: product.image_url,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  }));
}

/**
 * Get sales chart data for the last N days
 */
export async function getSalesChart(
  days = 30
): Promise<SalesChartDataPoint[]> {
  // Calculate start date
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch sales data
  const { data: sales, error } = await supabase
    .from('sales')
    .select('created_at, total')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching sales for chart:', error);
    throw AppError.internal('Failed to fetch sales chart data');
  }

  if (!sales || sales.length === 0) {
    return [];
  }

  // Group sales by day
  const salesByDay: Record<string, SalesChartDataPoint> = {};

  sales.forEach((sale) => {
    const date = sale.created_at.split('T')[0]; // Extract date (YYYY-MM-DD)

    if (!salesByDay[date]) {
      salesByDay[date] = {
        date,
        totalSales: 0,
        totalRevenue: 0,
      };
    }

    salesByDay[date].totalSales += 1;
    salesByDay[date].totalRevenue += parseFloat(sale.total.toString());
  });

  // Convert to array and sort by date
  return Object.values(salesByDay).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
