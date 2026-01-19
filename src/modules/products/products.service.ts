import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../config/supabase';
import { AppError } from '../../shared/utils/AppError';
import {
  CreateProductInput,
  UpdateProductInput,
  QueryProductsInput,
} from './products.schema';

/**
 * Product type from database
 */
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Formatted product type
 */
interface FormattedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_BUCKET = 'product-images';

/**
 * Get products with filters and pagination
 */
export async function getProducts(
  query: QueryProductsInput
): Promise<{ products: FormattedProduct[]; total: number }> {
  const {
    page,
    limit,
    search,
    minPrice,
    maxPrice,
    inStock,
    sortBy,
    sortOrder,
  } = query;

  // Calculate offset
  const offset = (page - 1) * limit;

  // Build query
  let supabaseQuery = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  // Apply filters
  if (search) {
    supabaseQuery = supabaseQuery.ilike('name', `%${search}%`);
  }

  if (minPrice !== undefined) {
    supabaseQuery = supabaseQuery.gte('price', minPrice);
  }

  if (maxPrice !== undefined) {
    supabaseQuery = supabaseQuery.lte('price', maxPrice);
  }

  if (inStock) {
    supabaseQuery = supabaseQuery.gt('stock', 0);
  }

  // Map sortBy to database column names
  const sortByMap: Record<string, string> = {
    name: 'name',
    price: 'price',
    createdAt: 'created_at',
    stock: 'stock',
  };

  // Apply sorting
  supabaseQuery = supabaseQuery.order(
    sortByMap[sortBy] || 'created_at',
    { ascending: sortOrder === 'asc' }
  );

  // Apply pagination
  supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

  const { data, error, count } = await supabaseQuery;

  if (error) {
    console.error('Error fetching products:', error);
    throw AppError.internal('Failed to fetch products');
  }

  return {
    products: (data || []).map(formatProduct),
    total: count || 0,
  };
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<FormattedProduct> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw AppError.notFound('Product not found');
  }

  return formatProduct(data as Product);
}

/**
 * Create a new product
 */
export async function createProduct(
  productData: CreateProductInput,
  imageFile?: Express.Multer.File
): Promise<FormattedProduct> {
  let imageUrl: string | null = null;

  // Upload image if provided
  if (imageFile) {
    imageUrl = await uploadImage(imageFile);
  }

  // Insert product
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: productData.name,
      description: productData.description || null,
      price: productData.price,
      stock: productData.stock,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    // If product creation fails, delete uploaded image
    if (imageUrl) {
      await deleteImage(imageUrl);
    }
    throw AppError.internal('Failed to create product');
  }

  if (!data) {
    throw AppError.internal('Failed to create product');
  }

  return formatProduct(data as Product);
}

/**
 * Update a product
 */
export async function updateProduct(
  id: string,
  productData: UpdateProductInput,
  imageFile?: Express.Multer.File
): Promise<FormattedProduct> {
  // Check if product exists
  const existingProduct = await getProductById(id);

  let imageUrl: string | undefined;

  // Handle image update
  if (imageFile) {
    // Upload new image
    imageUrl = await uploadImage(imageFile);

    // Delete old image if exists
    if (existingProduct.imageUrl) {
      await deleteImage(existingProduct.imageUrl);
    }
  }

  // Prepare update data
  const updateData: any = {
    ...productData,
    updated_at: new Date().toISOString(),
  };

  if (imageUrl) {
    updateData.image_url = imageUrl;
  }

  // Update product
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    // If update fails and we uploaded a new image, delete it
    if (imageUrl) {
      await deleteImage(imageUrl);
    }
    throw AppError.internal('Failed to update product');
  }

  if (!data) {
    throw AppError.internal('Failed to update product');
  }

  return formatProduct(data as Product);
}

/**
 * Delete a product (soft delete)
 */
export async function deleteProduct(id: string): Promise<void> {
  // Check if product exists
  await getProductById(id);

  // Soft delete
  const { error } = await supabase
    .from('products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    throw AppError.internal('Failed to delete product');
  }
}

/**
 * Upload image to Supabase Storage
 */
async function uploadImage(file: Express.Multer.File): Promise<string> {
  // Generate unique filename
  const fileExt = file.originalname.split('.').pop();
  const fileName = `products/${uuidv4()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw AppError.internal('Failed to upload image');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Delete image from Supabase Storage
 */
async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts.slice(-2).join('/'); // products/uuid.ext

    // Delete from storage
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileName]);

    if (error) {
      console.error('Error deleting image:', error);
      // Don't throw error, just log it
    }
  } catch (error) {
    console.error('Error parsing image URL:', error);
    // Don't throw error, just log it
  }
}

/**
 * Format product to camelCase
 */
function formatProduct(product: Product): FormattedProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: parseFloat(product.price.toString()),
    stock: product.stock,
    imageUrl: product.image_url,
    isActive: product.is_active,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}
