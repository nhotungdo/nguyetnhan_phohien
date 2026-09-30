"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAuth } from "@/services/api.service";

export function useAdminGuard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (!adminAuth.isLoggedIn()) {
        router.push("/admin-login");
      } else {
        setIsAuthorized(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  return { isAuthorized, isLoading };
}
