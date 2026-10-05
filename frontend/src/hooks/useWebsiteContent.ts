"use client";

import { useQuery } from "@tanstack/react-query";
import {
  defaultContents,
  fetchWebsiteContent,
  websiteContentQueryKey,
} from "@/lib/contentQuery";

export function useWebsiteContent() {
  const { data: content = defaultContents, isLoading } = useQuery({
    queryKey: websiteContentQueryKey,
    queryFn: fetchWebsiteContent,
  });

  return { content, isLoading };
}
