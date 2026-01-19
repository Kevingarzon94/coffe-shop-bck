import { supabase } from '../../config/supabase';
import { AppError } from '../../shared/utils/AppError';
import { CreateSaleInput, QuerySalesInput } from './sales.schema';

/**
 * Sale type from database
 */
interface Sale {
  id: string;
  customer_id: string;
  total: number;
  created_at: string;
}

/**
 * Sale with customer info
 */
interface SaleWithCustomer extends Sale {
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  items_count: number;
}

/**
 * Sale item from database
 */
interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  product_name?: string;
}

/**
 * Formatted sale type
 */
interface FormattedSale {
  id: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  total: number;
  itemsCount: number;
  createdAt: string;
}

/**
 * Formatted sale with items
 */
interface FormattedSaleWithItems {
  id: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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
 * Create a new sale using the process_sale RPC function
 */
export async function createSale(
  saleData: CreateSaleInput
): Promise<{ saleId: string; customerId: string; total: number }> {
  // Prepare items for RPC call
  const items = saleData.items.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
  }));

  // Call the process_sale RPC function
  const { data: result, error } = await supabase.rpc('process_sale', {
    p_customer_first_name: saleData.customer.firstName,
    p_customer_last_name: saleData.customer.lastName,
    p_customer_email: saleData.customer.email,
    p_items: items,
  });

  if (error) {
    console.error('Error calling process_sale RPC:', error);
    throw AppError.internal('Failed to process sale');
  }

  if (!result) {
    throw AppError.internal('No response from process_sale RPC');
  }

  // Check if the RPC function returned an error
  if (!result.success) {
    throw AppError.badRequest(result.message || 'Failed to process sale');
  }

  return {
    saleId: result.sale_id,
    customerId: result.customer_id,
    total: parseFloat(result.total),
  };
}

/**
 * Get sales with filters and pagination
 */
export async function getSales(
  query: QuerySalesInput
): Promise<{ sales: FormattedSale[]; total: number }> {
  const { page, limit, from, to, customerId } = query;

  // Calculate offset
  const offset = (page - 1) * limit;

  // Build query with joins
  let supabaseQuery = supabase
    .from('sales')
    .select(
      `
      id,
      customer_id,
      total,
      created_at,
      customers!inner(
        first_name,
        last_name,
        email
      ),
      sale_items(count)
    `,
      { count: 'exact' }
    );

  // Apply filters
  if (from) {
    supabaseQuery = supabaseQuery.gte('created_at', from);
  }

  if (to) {
    supabaseQuery = supabaseQuery.lte('created_at', to);
  }

  if (customerId) {
    supabaseQuery = supabaseQuery.eq('customer_id', customerId);
  }

  // Apply sorting
  supabaseQuery = supabaseQuery.order('created_at', { ascending: false });

  // Apply pagination
  supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

  const { data, error, count } = await supabaseQuery;

  if (error) {
    console.error('Error fetching sales:', error);
    throw AppError.internal('Failed to fetch sales');
  }

  // Format sales
  const formattedSales: FormattedSale[] = (data || []).map((sale: any) => ({
    id: sale.id,
    customer: {
      id: sale.customer_id,
      firstName: sale.customers.first_name,
      lastName: sale.customers.last_name,
      email: sale.customers.email,
    },
    total: parseFloat(sale.total),
    itemsCount: sale.sale_items[0]?.count || 0,
    createdAt: sale.created_at,
  }));

  return {
    sales: formattedSales,
    total: count || 0,
  };
}

/**
 * Get sale by ID with items
 */
export async function getSaleById(
  id: string
): Promise<FormattedSaleWithItems> {
  // Get sale with customer info
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select(
      `
      id,
      customer_id,
      total,
      created_at,
      customers!inner(
        first_name,
        last_name,
        email
      )
    `
    )
    .eq('id', id)
    .single();

  if (saleError || !sale) {
    throw AppError.notFound('Sale not found');
  }

  // Get sale items with product info
  const { data: items, error: itemsError } = await supabase
    .from('sale_items')
    .select(
      `
      id,
      product_id,
      quantity,
      unit_price,
      subtotal,
      products!inner(
        name
      )
    `
    )
    .eq('sale_id', id)
    .order('created_at', { ascending: true });

  if (itemsError) {
    console.error('Error fetching sale items:', itemsError);
    throw AppError.internal('Failed to fetch sale items');
  }

  // Format response
  return {
    id: sale.id,
    customer: {
      id: sale.customer_id,
      firstName: (sale.customers as any).first_name,
      lastName: (sale.customers as any).last_name,
      email: (sale.customers as any).email,
    },
    total: parseFloat(sale.total),
    items: (items || []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.products.name,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      subtotal: parseFloat(item.subtotal),
    })),
    createdAt: sale.created_at,
  };
}
