/**
 * Default pagination values
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Extracts and validates pagination parameters from query string
 */
export function getPaginationParams(query: any): {
  page: number;
  limit: number;
  offset: number;
} {
  // Parse and validate page number
  let page = parseInt(query.page as string, 10);
  if (isNaN(page) || page < 1) {
    page = DEFAULT_PAGE;
  }

  // Parse and validate limit
  let limit = parseInt(query.limit as string, 10);
  if (isNaN(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  }

  // Ensure limit doesn't exceed maximum
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  // Calculate offset for database queries
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
}

/**
 * Calculates total number of pages based on total items and limit
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Gets sorting parameters from query string
 */
export function getSortingParams(
  query: any,
  defaultSortBy = 'created_at',
  defaultSortOrder: 'asc' | 'desc' = 'desc'
): {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
} {
  const sortBy = query.sortBy || defaultSortBy;
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : defaultSortOrder;

  return {
    sortBy,
    sortOrder,
  };
}
