"use client";

import { useMemo, useState } from "react";

export function usePagination(pageSize = 20) {
  const [page, setPage] = useState(1);

  return useMemo(
    () => ({
      page,
      pageSize,
      offset: (page - 1) * pageSize,
      nextPage: () => setPage((value) => value + 1),
      previousPage: () => setPage((value) => Math.max(1, value - 1)),
      setPage
    }),
    [page, pageSize]
  );
}
