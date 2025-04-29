/**
 * Calculate pagination metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page number (1-based)
 * @param {number} pageSize - Number of items per page
 * @returns {Object} Pagination metadata
 */
export function getPaginationMetadata(total, page, pageSize) {
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        startIndex: (page - 1) * pageSize,
        endIndex: Math.min(page * pageSize, total),
        // Generate page numbers array with ellipsis
        pages: generatePageNumbers(page, totalPages)
    };
}

/**
 * Generate an array of page numbers with ellipsis
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @returns {Array} Array of page numbers and ellipsis
 */
export function generatePageNumbers(currentPage, totalPages) {
    const delta = 2; // Number of pages to show before and after current page
    const pages = [];

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    let rangeStart = Math.max(2, currentPage - delta);
    let rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    // Adjust range to show more pages when current page is near the edges
    if (currentPage - delta > 2) {
        pages.push('...');
    }

    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i);
    }

    // Add ellipsis and last page if necessary
    if (rangeEnd < totalPages - 1) {
        pages.push('...');
    }
    if (totalPages > 1) {
        pages.push(totalPages);
    }

    return pages;
}

/**
 * Parse pagination parameters from query string
 * @param {Object} searchParams - URL search params object
 * @returns {Object} Parsed pagination parameters
 */
export function parsePaginationParams(searchParams) {
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get('pageSize')) || 10));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    return {
        page,
        pageSize,
        sortBy,
        sortOrder,
        skip: (page - 1) * pageSize,
        take: pageSize
    };
}

/**
 * Generate pagination SQL query parts
 * @param {Object} params - Pagination parameters
 * @returns {Object} SQL query parts for pagination
 */
export function getPaginationQuery(params) {
    const { skip, take, sortBy, sortOrder } = parsePaginationParams(params);

    return {
        skip,
        take,
        orderBy: {
            [sortBy]: sortOrder
        }
    };
}

/**
 * Create pagination links for API responses
 * @param {Object} metadata - Pagination metadata
 * @param {string} baseUrl - Base URL for pagination links
 * @param {Object} searchParams - Current search parameters
 * @returns {Object} Pagination links
 */
export function getPaginationLinks(metadata, baseUrl, searchParams) {
    const { page, totalPages } = metadata;
    const params = new URLSearchParams(searchParams);

    const createUrl = (pageNum) => {
        params.set('page', pageNum);
        return `${baseUrl}?${params.toString()}`;
    };

    return {
        first: createUrl(1),
        last: createUrl(totalPages),
        next: metadata.hasNextPage ? createUrl(page + 1) : null,
        prev: metadata.hasPreviousPage ? createUrl(page - 1) : null,
    };
} 