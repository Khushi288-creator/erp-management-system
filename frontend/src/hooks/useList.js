import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";

// Table wale har page ke liye: data lana, search, pagination, refresh
export default function useList(url, params = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // MUI me page 0 se shuru hota hai
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const paramsKey = JSON.stringify(params);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(url, {
        params: {
          page: page + 1, // backend me page 1 se shuru hota hai
          limit: rowsPerPage,
          search: search || undefined,
          ...JSON.parse(paramsKey),
        },
      });
      setItems(data.items ?? data.products ?? data.users ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [url, page, rowsPerPage, search, paramsKey]);

  // Har akshar par API na chale, isliye thoda ruk ke call hoti hai
  useEffect(() => {
    const timer = setTimeout(fetchData, 350);
    return () => clearTimeout(timer);
  }, [fetchData]);

  return {
    items, total, page, setPage, rowsPerPage, search, loading,
    setRowsPerPage: (n) => {
      setRowsPerPage(n);
      setPage(0);
    },
    onSearch: (value) => {
      setSearch(value);
      setPage(0);
    },
    refresh: fetchData,
  };
}
