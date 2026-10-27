import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";

const Ctx = createContext(null);

export function ContentProvider({ children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const res = await api.get("/content");
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(formatApiError(e));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return <Ctx.Provider value={{ data, error, reload }}>{children}</Ctx.Provider>;
}

export const useContent = () => useContext(Ctx);

export function useWorld(slug) {
  const { data } = useContent();
  return { loading: !data, world: data?.worlds?.find((w) => w.slug === slug) };
}
