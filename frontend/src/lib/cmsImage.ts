const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050").replace(/\/+$/, "");

export const resolveCmsImage = (url?: string) =>
  !url
    ? ""
    : url.startsWith("/images/") || /^(https?:)?\/\//i.test(url) || url.startsWith("data:")
      ? url
      : url.startsWith("/uploads/") || url.startsWith("uploads/")
        ? (url.startsWith("/") ? url : `/${url}`)
        : `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;

