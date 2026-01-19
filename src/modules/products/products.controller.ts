import { Response, NextFunction } from 'express';
import multer from 'multer';
import * as productsService from './products.service';
import { AuthRequest } from '../auth/auth.middleware';
import { successResponse, paginatedResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/utils/AppError';
import {
  CreateProductInput,
  UpdateProductInput,
  QueryProductsInput,
} from './products.schema';

/**
 * Configure multer for image upload
 */
const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept only image files
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only JPEG, PNG and WebP images are allowed',
        400,
        'INVALID_FILE_TYPE'
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

/**
 * Get all products with filters
 */
export async function getProducts(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query: QueryProductsInput = req.query as any;

    const { products, total } = await productsService.getProducts(query);

    res.json(
      paginatedResponse(
        products,
        total,
        query.page,
        query.limit
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Get product by ID
 */
export async function getProductById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const product = await productsService.getProductById(id);

    res.json(successResponse(product));
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new product
 */
export async function createProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Parse numeric fields from form-data (they come as strings)
    const productData: CreateProductInput = {
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock, 10),
    };

    const imageFile = req.file;

    const product = await productsService.createProduct(
      productData,
      imageFile
    );

    res.status(201).json(
      successResponse(
        product,
        'Product created successfully'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Update a product
 */
export async function updateProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Parse numeric fields from form-data (they come as strings)
    const productData: UpdateProductInput = {};

    if (req.body.name) {
      productData.name = req.body.name;
    }
    if (req.body.description !== undefined) {
      productData.description = req.body.description;
    }
    if (req.body.price) {
      productData.price = parseFloat(req.body.price);
    }
    if (req.body.stock !== undefined) {
      productData.stock = parseInt(req.body.stock, 10);
    }

    const imageFile = req.file;

    const product = await productsService.updateProduct(
      id,
      productData,
      imageFile
    );

    res.json(
      successResponse(
        product,
        'Product updated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a product (soft delete)
 */
export async function deleteProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    await productsService.deleteProduct(id);

    res.json(
      successResponse(
        null,
        'Product deleted successfully'
      )
    );
  } catch (error) {
    next(error);
  }
}
