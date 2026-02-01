/**
 * Custom React Hooks for API Integration
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for API calls with loading and error states
 * @param {Function} apiFunction - API function to call
 * @param {Array} dependencies - Dependencies for useEffect
 * @param {boolean} immediate - Whether to call immediately on mount
 */
export function useApi(apiFunction, dependencies = [], immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunction(...args);
      setData(response.data || response);
      return response;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return { data, loading, error, execute, setData };
}

/**
 * Hook for paginated API calls
 * @param {Function} apiFunction - API function that accepts params
 * @param {Object} initialParams - Initial query parameters
 */
export function usePaginatedApi(apiFunction, initialParams = {}) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [params, setParams] = useState(initialParams);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (newParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const mergedParams = { ...params, ...newParams };
      const response = await apiFunction(mergedParams);
      setData(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      setParams(mergedParams);
      return response;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, params]);

  useEffect(() => {
    fetchData();
  }, []);

  const goToPage = (page) => fetchData({ page });
  const setLimit = (limit) => fetchData({ page: 1, limit });
  const refresh = () => fetchData();
  const search = (searchParams) => fetchData({ ...searchParams, page: 1 });

  return {
    data,
    pagination,
    loading,
    error,
    fetchData,
    goToPage,
    setLimit,
    refresh,
    search,
    setData
  };
}

/**
 * Hook for form submission with API
 * @param {Function} apiFunction - API function for form submission
 * @param {Object} options - { onSuccess, onError }
 */
export function useFormSubmit(apiFunction, options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunction(formData);
      if (options.onSuccess) {
        options.onSuccess(response);
      }
      return response;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      if (options.onError) {
        options.onError(err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error, setError };
}

/**
 * Hook for handling CRUD operations
 * @param {Object} api - API object with getAll, create, update, delete methods
 */
export function useCrud(api) {
  const {
    data,
    pagination,
    loading,
    error,
    refresh,
    search,
    goToPage,
    setData
  } = usePaginatedApi(api.getAll);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const create = async (item) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const response = await api.create(item);
      await refresh();
      return response;
    } catch (err) {
      setActionError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const update = async (id, item) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const response = await api.update(id, item);
      await refresh();
      return response;
    } catch (err) {
      setActionError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const remove = async (id) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const response = await api.delete(id);
      await refresh();
      return response;
    } catch (err) {
      setActionError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    data,
    pagination,
    loading,
    error,
    actionLoading,
    actionError,
    refresh,
    search,
    goToPage,
    create,
    update,
    remove,
    setData
  };
}
