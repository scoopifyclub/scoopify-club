import { toast } from 'sonner';

export const swrConfig = {
    // Enable React Suspense mode
    suspense: false,

    // Revalidate when window gains focus
    revalidateOnFocus: true,

    // Revalidate when network regains connection
    revalidateOnReconnect: true,

    // Retry failed requests
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,

    // Keep previous data while revalidating
    keepPreviousData: true,

    // Dedupe requests within this time window
    dedupingInterval: 2000,

    // Global onError handler
    onError: (error, key) => {
        console.error(`SWR Error for ${key}:`, error);
        toast.error('An error occurred while fetching data');
    },

    // Global fetcher function
    fetcher: async (url) => {
        const response = await fetch(url, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = new Error('An error occurred while fetching the data.');
            error.info = await response.json();
            error.status = response.status;
            throw error;
        }

        return response.json();
    }
}; 