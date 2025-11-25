// src/utils/useMediaQuery.js
import { useState, useEffect } from 'react';

/**
 * Custom hook to detect screen size based on media query
 * @param {string} query - CSS media query string
 * @returns {boolean} - Whether the media query matches
 * 
 * Example usage:
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 991px)');
 * const isDesktop = useMediaQuery('(min-width: 992px)');
 */
export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        // Check if window is defined (SSR safety)
        if (typeof window === 'undefined') {
            return;
        }

        const media = window.matchMedia(query);

        // Set initial value
        setMatches(media.matches);

        // Create event listener
        const listener = (event) => {
            setMatches(event.matches);
        };

        // Add listener (modern browsers)
        if (media.addEventListener) {
            media.addEventListener('change', listener);
        } else {
            // Fallback for older browsers
            media.addListener(listener);
        }

        // Cleanup
        return () => {
            if (media.removeEventListener) {
                media.removeEventListener('change', listener);
            } else {
                media.removeListener(listener);
            }
        };
    }, [query]);

    return matches;
};

/**
 * Predefined breakpoint hooks for convenience
 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 991px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 992px)');
export const useIsLargeDesktop = () => useMediaQuery('(min-width: 1200px)');

// Export breakpoint values as constants for consistency
export const BREAKPOINTS = {
    mobile: 767,
    tablet: 991,
    desktop: 992,
    largeDesktop: 1200,
};

export default useMediaQuery;
