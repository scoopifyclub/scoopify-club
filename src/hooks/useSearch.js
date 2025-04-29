import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { debounceAsync } from '@/lib/debounce';
import { swrConfig } from '@/lib/swr-config';

/**
 * Hook for handling search with debouncing and caching
 * @param {Object} options - Hook options
 * @param {string} options.path - API path for search
 * @param {number} options.debounceMs - Debounce delay in milliseconds
 * @param {Object} options.defaultFilters - Default filter values
 * @param {Function} options.onSearch - Callback when search is performed
 * @returns {Object} Search state and handlers
 */
export function useSearch(options = {}) {
    const {
        path,
        debounceMs = 300,
        defaultFilters = {},
        onSearch
    } = options;

    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Get initial search term from URL
    const initialTerm = searchParams.get('q') || '';
    const [searchTerm, setSearchTerm] = useState(initialTerm);
    
    // Get initial filters from URL and defaults
    const initialFilters = Object.keys(defaultFilters).reduce((acc, key) => {
        acc[key] = searchParams.get(key) || defaultFilters[key];
        return acc;
    }, {});
    const [filters, setFilters] = useState(initialFilters);

    // Track if this is the initial mount
    const isFirstMount = useRef(true);

    // Create the query string
    const queryString = new URLSearchParams({
        q: searchTerm,
        ...filters
    }).toString();

    // Fetch data using SWR
    const {
        data,
        error,
        isValidating,
        mutate
    } = useSWR(
        searchTerm || Object.values(filters).some(Boolean)
            ? `${path}?${queryString}`
            : null,
        swrConfig.fetcher,
        {
            ...swrConfig,
            revalidateOnFocus: false,
            dedupingInterval: 5000
        }
    );

    // Update URL with search params
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        const params = new URLSearchParams(window.location.search);
        
        // Update search term
        if (searchTerm) {
            params.set('q', searchTerm);
        } else {
            params.delete('q');
        }
        
        // Update filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        // Update URL
        const newUrl = params.toString()
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;
            
        router.push(newUrl, { scroll: false });
    }, [searchTerm, filters, router]);

    // Debounced search handler
    const debouncedSearch = useCallback(
        debounceAsync(async (term, currentFilters, signal) => {
            // Update search term state
            setSearchTerm(term);
            
            // Call onSearch callback if provided
            if (onSearch) {
                await onSearch(term, currentFilters);
            }
        }, debounceMs),
        [onSearch, debounceMs]
    );

    // Handle search input change
    const handleSearch = useCallback((term) => {
        debouncedSearch(term, filters);
    }, [debouncedSearch, filters]);

    // Handle filter change
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => {
            const newFilters = {
                ...prev,
                [key]: value
            };
            
            // Trigger search with new filters
            debouncedSearch(searchTerm, newFilters);
            
            return newFilters;
        });
    }, [debouncedSearch, searchTerm]);

    // Clear all filters and search
    const handleClear = useCallback(() => {
        setSearchTerm('');
        setFilters(defaultFilters);
        router.push(window.location.pathname, { scroll: false });
    }, [defaultFilters, router]);

    return {
        // State
        searchTerm,
        filters,
        data,
        error,
        isLoading: !data && !error,
        isValidating,

        // Handlers
        handleSearch,
        handleFilterChange,
        handleClear,
        refresh: mutate,

        // URL state
        queryString,
    };
} 