// Request deduplication utility to prevent duplicate API calls
class RequestDeduper {
  constructor() {
    this.pendingRequests = new Map();
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  // Generate a unique key for the request
  generateKey(method, url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    return `${method}:${url}:${JSON.stringify(sortedParams)}`;
  }

  // Check if request is already pending
  isPending(key) {
    return this.pendingRequests.has(key);
  }

  // Get cached result if available and not expired
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    // Remove expired cache
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  // Set a request as pending
  setPending(key, promise) {
    this.pendingRequests.set(key, promise);

    // Clean up when promise resolves
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return promise;
  }

  // Cache a successful result
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache for a specific key or pattern
  clearCache(keyPattern) {
    if (keyPattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(keyPattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Make a deduplicated request
  async makeRequest(method, url, params = {}, options = {}) {
    const key = this.generateKey(method, url, params);

    // Check cache first (for GET requests)
    if (method === 'GET' || method === 'SELECT') {
      const cached = this.getCached(key);
      if (cached) {
        return cached;
      }
    }

    // Check if request is already pending
    if (this.isPending(key)) {
      return this.pendingRequests.get(key);
    }

    // Create the actual request function
    const makeActualRequest = async () => {
      try {
        // This would be replaced with actual API call logic
        // For now, return a placeholder
        const result = await this.executeRequest(method, url, params, options);

        // Cache successful GET results
        if ((method === 'GET' || method === 'SELECT') && result) {
          this.setCache(key, result);
        }

        return result;
      } catch (error) {
        // Don't cache errors
        throw error;
      }
    };

    // Set as pending and execute
    return this.setPending(key, makeActualRequest());
  }

  // Execute the actual request (to be implemented by specific API clients)
  async executeRequest(method, url, params, options) {
    // This should be overridden by the specific implementation
    throw new Error('executeRequest must be implemented by subclass');
  }
}

// Supabase-specific request deduper
export class SupabaseRequestDeduper extends RequestDeduper {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  async executeRequest(method, tableName, params, options) {
    try {
      let query = this.supabase.from(tableName);

      // Apply method-specific logic
      switch (method) {
        case 'SELECT':
          if (params.select) query = query.select(params.select);
          if (params.eq) {
            Object.entries(params.eq).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          if (params.ilike) {
            Object.entries(params.ilike).forEach(([key, value]) => {
              query = query.ilike(key, value);
            });
          }
          if (params.gte) {
            Object.entries(params.gte).forEach(([key, value]) => {
              query = query.gte(key, value);
            });
          }
          if (params.lte) {
            Object.entries(params.lte).forEach(([key, value]) => {
              query = query.lte(key, value);
            });
          }
          if (params.order) {
            query = query.order(params.order.column, { ascending: params.order.ascending });
          }
          if (params.range) {
            query = query.range(params.range.from, params.range.to);
          }
          if (params.limit) query = query.limit(params.limit);
          if (params.single) query = query.single();

          const { data, error, count } = await query;
          if (error) throw error;
          return { data, count };

        case 'INSERT':
          const { data: insertData, error: insertError } = await query.insert(params.data);
          if (insertError) throw insertError;
          return insertData;

        case 'UPDATE':
          if (params.eq) {
            Object.entries(params.eq).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          const { data: updateData, error: updateError } = await query.update(params.data);
          if (updateError) throw updateError;
          return updateData;

        case 'DELETE':
          if (params.eq) {
            Object.entries(params.eq).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          const { error: deleteError } = await query.delete();
          if (deleteError) throw deleteError;
          return true;

        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    } catch (error) {
      console.error('Supabase request error:', error);
      throw error;
    }
  }
}

// Create singleton instance
let deduperInstance = null;

export const getRequestDeduper = (supabaseClient) => {
  if (!deduperInstance) {
    deduperInstance = new SupabaseRequestDeduper(supabaseClient);
  }
  return deduperInstance;
};

export default RequestDeduper;