import { useEffect, useRef, useCallback } from 'react';
import useSWRInfinite from 'swr/infinite';
import { swrConfig } from '@/lib/swr-config';

/**
 * Hook for infinite scrolling with SWR
 * @param {string} path - Base API path
 * @param {Object} options - Additional options
 * @param {number} options.pageSize - Number of items per page
 * @param {Object} options.filters - Query filters
 * @param {Function} options.onError - Error callback
 * @returns {Object} Infinite scroll state and handlers
 */
export function useInfiniteScroll(path, options = {}) {
    const {
        pageSize = 10,
        filters = {},
        onError
    } = options;

    // Create a ref for the observer
    const observerRef = useRef();
    // Create a ref for the loading element
    const loadingRef = useRef();

    // Get the key for each page
    const getKey = (pageIndex, previousPageData) => {
        // Reached the end
        if (previousPageData && !previousPageData.items?.length) return null;

        // Convert filters to query string
        const queryString = new URLSearchParams({
            ...filters,
            page: pageIndex + 1,
            pageSize
        }).toString();

        // First page, no previousPageData
        return `${path}?${queryString}`;
    };

    // Fetch data using SWR infinite
    const {
        data,
        error,
        size,
        setSize,
        isValidating,
        mutate
    } = useSWRInfinite(getKey, swrConfig.fetcher, {
        ...swrConfig,
        onError: (err) => {
            onError?.(err);
            swrConfig.onError(err);
        },
        revalidateFirstPage: false,
        persistSize: true,
    });

    // Flatten all pages data
    const items = data ? data.flatMap(page => page.items || []) : [];
    const isLoadingInitialData = !data && !error;
    const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined");
    const isEmpty = data?.[0]?.items?.length === 0;
    const isReachingEnd = isEmpty || (data && data[data.length - 1]?.items?.length < pageSize);
    const isRefreshing = isValidating && data && data.length === size;

    // Callback for intersection observer
    const handleObserver = useCallback((entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isReachingEnd && !isLoadingMore) {
            setSize(size => size + 1);
        }
    }, [isReachingEnd, isLoadingMore, setSize]);

    // Set up intersection observer
    useEffect(() => {
        const element = loadingRef.current;
        if (!element) return;

        observerRef.current = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '0px',
            threshold: 1.0
        });

        observerRef.current.observe(element);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleObserver]);

    // Helper function to refresh data
    const refresh = useCallback(async () => {
        await mutate();
    }, [mutate]);

    return {
        // Data
        items,
        error,
        
        // Loading states
        isLoadingInitialData,
        isLoadingMore,
        isRefreshing,
        
        // Status flags
        isEmpty,
        isReachingEnd,
        
        // Actions
        refresh,
        setSize,
        mutate,
        
        // Refs
        loadingRef,
        
        // Raw data
        pages: data,
        pageCount: size,
    };
} 