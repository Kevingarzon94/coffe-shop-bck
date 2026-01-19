import { supabase } from '../../config/supabase';
import { AppError } from '../../shared/utils/AppError';
import { QueryCustomersInput } from './customers.schema';

/**
 * Customer type from database
 */
interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

/**
 * Formatted customer type
 */
interface FormattedCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Purchase summary
 */
interface PurchaseSummary {
  id: string;
  total: number;
  itemsCount: number;
  createdAt: string;
}

/**
 * Purchase with items
 */
interface PurchaseWithItems {
  id: string;
  total: number;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  createdAt: string;
}

/**
 * Get customers with filters and pagination
 */
export async function getCustomers(
  query: QueryCustomersInput
): Promise<{ customers: FormattedCustomer[]; total: number }> {
  const { page, limit, search, sortBy, sortOrder } = query;

  // Calculate offset
  const offset = (page - 1) * limit;

  // Build base query
  let supabaseQuery = supabase
    .from('customers')
    .select('*', { count: 'exact' });

  // Apply search filter
  if (search) {
    supabaseQuery = supabaseQuery.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  // Map sortBy to database column names
  const sortByMap: Record<string, string> = {
    firstName: 'first_name',
    lastName: 'last_name',
    createdAt: 'created_at',
    totalPurchases: 'created_at', // Default fallback
    totalSpent: 'created_at', // Default fallback
  };

  // Apply sorting (for totalPurchases and totalSpent, we'll need aggregation in a future enhancement)
  supabaseQuery = supabaseQuery.order(
    sortByMap[sortBy] || 'created_at',
    { ascending: sortOrder === 'asc' }
  );

  // Apply pagination
  supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

  const { data, error, count } = await supabaseQuery;

  if (error) {
    console.error('Error fetching customers:', error);
    throw AppError.internal('Failed to fetch customers');
  }

  return {
    customers: (data || []).map(formatCustomer),
    total: count || 0,
  };
}

/**
 * Get customer by ID with purchase history
 */
export async function getCustomerById(
  id: string
): Promise<{
  customer: FormattedCustomer;
  purchases: PurchaseSummary[];
  stats: {
    totalPurchases: number;
    totalSpent: number;
  };
}> {
  // Get customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (customerError || !customer) {
    throw AppError.notFound('Customer not found');
  }

  // Get purchase history
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select(
      `
      id,
      total,
      created_at,
      sale_items(count)
    `
    )
    .eq('customer_id', id)
    .order('created_at', { ascending: false });

  if (salesError) {
    console.error('Error fetching customer purchases:', salesError);
    throw AppError.internal('Failed to fetch customer purchases');
  }

  // Calculate stats
  const totalPurchases = sales?.length || 0;
  const totalSpent = sales?.reduce(
    (sum, sale) => sum + parseFloat(sale.total.toString()),
    0
  ) || 0;

  // Format purchases
  const purchases: PurchaseSummary[] = (sales || []).map((sale: any) => ({
    id: sale.id,
    total: parseFloat(sale.total),
    itemsCount: sale.sale_items[0]?.count || 0,
    createdAt: sale.created_at,
  }));

  return {
    customer: formatCustomer(customer as Customer),
    purchases,
    stats: {
      totalPurchases,
      totalSpent,
    },
  };
}

/**
 * Get customer purchase history with pagination
 */
export async function getCustomerPurchaseHistory(
  customerId: string,
  page: number,
  limit: number
): Promise<{ purchases: PurchaseWithItems[]; total: number }> {
  // Verify customer exists
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .single();

  if (customerError || !customer) {
    throw AppError.notFound('Customer not found');
  }

  // Calculate offset
  const offset = (page - 1) * limit;

  // Get sales with count
  const { data: sales, error: salesError, count } = await supabase
    .from('sales')
    .select('id, total, created_at', { count: 'exact' })
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (salesError) {
    console.error('Error fetching purchase history:', salesError);
    throw AppError.internal('Failed to fetch purchase history');
  }

  if (!sales || sales.length === 0) {
    return {
      purchases: [],
      total: count || 0,
    };
  }

  // Get items for each sale
  const purchasesWithItems: PurchaseWithItems[] = [];

  for (const sale of sales) {
    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select(
        `
        id,
        product_id,
        quantity,
        unit_price,
        subtotal,
        products!inner(name)
      `
      )
      .eq('sale_id', sale.id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('Error fetching sale items:', itemsError);
      continue;
    }

    purchasesWithItems.push({
      id: sale.id,
      total: parseFloat(sale.total.toString()),
      items: (items || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.products.name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        subtotal: parseFloat(item.subtotal),
      })),
      createdAt: sale.created_at,
    });
  }

  return {
    purchases: purchasesWithItems,
    total: count || 0,
  };
}

/**
 * Format customer to camelCase
 */
function formatCustomer(customer: Customer): FormattedCustomer {
  return {
    id: customer.id,
    firstName: customer.first_name,
    lastName: customer.last_name,
    email: customer.email,
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
  };
}
