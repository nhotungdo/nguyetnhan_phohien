"use client";

import ContentCMS from "@/views/content/ContentCMS";

// Redirect logic: trang /products nay duoc gop vao /content tab san-pham
// Giu lai file nay de tranh 404 neu co link cu den day
export default function ProductsPage() {
  return <ContentCMS />;
}
