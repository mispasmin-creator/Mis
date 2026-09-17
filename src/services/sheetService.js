/**
 * Centralized Google Apps Script Sheet Data Service
 * 
 * Features:
 * - Request Deduplication: Merges concurrent calls for the same sheet into a single network request.
 * - In-Memory & SessionStorage Caching: Provides instant (< 50ms) data on navigation / reload.
 * - Auto-Retry: Retries transient network/quota failures once.
 * - Isolated Error Handling: Prevents failure of one sheet from crashing other sheets.
 */

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// In-memory cache: { [sheetName]: { data: any, timestamp: number } }
const memoryCache = new Map();

// In-flight Promise tracker: { [sheetName]: Promise<any> }
const inFlightRequests = new Map();

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = 'mis_sheet_cache_';

/**
 * Read from sessionStorage
 */
function getSessionCache(sheetName, ttlMs) {
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${sheetName}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < ttlMs) {
      return parsed.data;
    }
    sessionStorage.removeItem(`${CACHE_PREFIX}${sheetName}`);
  } catch (e) {
    // Session storage not available or corrupted
  }
  return null;
}

/**
 * Write to sessionStorage
 */
function setSessionCache(sheetName, data) {
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${sheetName}`, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (e) {
    // Session storage quota or error
  }
}

/**
 * Clear cached data for a specific sheet or all sheets
 */
export function clearSheetCache(sheetName) {
  if (sheetName) {
    memoryCache.delete(sheetName);
    try {
      sessionStorage.removeItem(`${CACHE_PREFIX}${sheetName}`);
    } catch (e) {}
  } else {
    memoryCache.clear();
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (e) {}
  }
}

/**
 * Fetch a single sheet with deduplication, retry, and caching.
 * 
 * @param {string} sheetName - Sheet name (e.g. 'Master', 'For Records', 'Data')
 * @param {object} options
 * @param {boolean} options.forceRefresh - If true, bypasses cache and fetches fresh data
 * @param {number} options.ttl - Cache time-to-live in ms (default 5 mins)
 * @returns {Promise<{ success: boolean, data: any[], error?: string }>}
 */
export async function fetchSheet(sheetName, { forceRefresh = false, ttl = DEFAULT_TTL_MS } = {}) {
  if (!SCRIPT_URL) {
    console.error('[sheetService] VITE_APPS_SCRIPT_URL is not defined in environment variables');
    return { success: false, data: [], error: 'VITE_APPS_SCRIPT_URL not configured' };
  }

  // 1. Check in-memory cache if not forceRefresh
  if (!forceRefresh) {
    const mem = memoryCache.get(sheetName);
    if (mem && (Date.now() - mem.timestamp < ttl)) {
      return mem.data;
    }

    // 2. Check sessionStorage
    const sessionData = getSessionCache(sheetName, ttl);
    if (sessionData) {
      // populate memory cache for speed
      memoryCache.set(sheetName, { data: sessionData, timestamp: Date.now() });
      return sessionData;
    }
  }

  // 3. Deduplicate in-flight requests:
  // If an identical request for this sheet is currently active, return that same promise.
  if (inFlightRequests.has(sheetName)) {
    return inFlightRequests.get(sheetName);
  }

  const fetchPromise = (async () => {
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const url = `${SCRIPT_URL}?sheet=${encodeURIComponent(sheetName)}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const json = await res.json();

        if (json && json.success) {
          // Store in memory & session cache
          memoryCache.set(sheetName, { data: json, timestamp: Date.now() });
          setSessionCache(sheetName, json);
          return json;
        } else {
          // If Apps Script returned success: false
          return {
            success: false,
            data: [],
            error: json?.error || `Failed to fetch sheet ${sheetName}`
          };
        }
      } catch (err) {
        console.warn(`[sheetService] Attempt ${attempts} failed for "${sheetName}":`, err.message);
        if (attempts >= maxAttempts) {
          return {
            success: false,
            data: [],
            error: err.message
          };
        }
        // Wait 800ms before retry
        await new Promise(r => setTimeout(r, 800));
      }
    }
  })();

  inFlightRequests.set(sheetName, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    inFlightRequests.delete(sheetName);
  }
}

/**
 * Fetch multiple sheets in parallel with deduplication and error isolation.
 * If one fails, others will still succeed!
 * 
 * @param {string[]} sheetNames
 * @param {object} options
 * @returns {Promise<Record<string, { success: boolean, data: any[], error?: string }>>}
 */
export async function fetchMultipleSheets(sheetNames, options = {}) {
  const promises = sheetNames.map(name =>
    fetchSheet(name, options).then(result => ({ name, result }))
  );

  const settled = await Promise.allSettled(promises);
  const results = {};

  settled.forEach((item, index) => {
    const sheetName = sheetNames[index];
    if (item.status === 'fulfilled') {
      results[sheetName] = item.value.result;
    } else {
      results[sheetName] = {
        success: false,
        data: [],
        error: item.reason?.message || 'Unknown error'
      };
    }
  });

  return results;
}
