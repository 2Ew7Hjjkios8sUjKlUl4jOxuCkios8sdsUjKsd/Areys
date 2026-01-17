
/**
 * Fetches a file, upgrading to a CORS proxy if the direct request fails.
 * @param {string} url - The URL to fetch
 * @returns {Promise<Response>} - The fetch response
 */
export const fetchTemplate = async (url) => {
    // Add cache buster
    const urlWithCache = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;

    try {
        const response = await fetch(urlWithCache);
        if (response.ok) return response;
        throw new Error(`Direct fetch failed: ${response.status}`);
    } catch (error) {
        console.warn(`Direct fetch failed for ${url}. Attempting to use CORS proxy...`, error);

        // Use AllOrigins proxy as first fallback
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlWithCache)}`;

        try {
            const proxyResponse = await fetch(proxyUrl);
            if (proxyResponse.ok) return proxyResponse;
            throw new Error(`AllOrigins Proxy failed: ${proxyResponse.status}`);
        } catch (proxyError) {
            console.warn(`AllOrigins failed, trying CorsProxy.io...`, proxyError);

            // Use CorsProxy.io as second fallback
            const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(urlWithCache)}`;
            try {
                const proxyResponse2 = await fetch(proxyUrl2);
                if (proxyResponse2.ok) return proxyResponse2;
                throw new Error(`CorsProxy.io failed: ${proxyResponse2.status}`);
            } catch (proxyError2) {
                throw new Error(`Failed to fetch template. Please check the link permissions (CORS/Public). Original error: ${error.message}`);
            }
        }
    }
};
