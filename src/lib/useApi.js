import { useEffect, useState } from "react";
import { apiFetch } from "./api";

export function useApi(path, fallback = null, deps = []) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    if (!path) {
      setLoading(false);
      setError(null);
      return () => {};
    }

    setLoading(true);
    setError(null);

    apiFetch(path).then((nextData) => {
      if (isCancelled) return;
      if (nextData !== null) {
        setData(nextData);
      } else {
        setError("Failed to load");
      }
      setLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [path, ...deps]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      if (!path) return Promise.resolve(null);
      return apiFetch(path).then((nextData) => {
        if (nextData !== null) {
          setData(nextData);
          setError(null);
        }
        return nextData;
      });
    },
  };
}
