"use client";

import { useEffect } from "react";
import { getStoredAccessToken, syncAccessTokenToCookie } from "@/lib/client-auth";

/** Đồng bộ accessToken từ localStorage sang cookie để middleware nhận diện phiên đăng nhập. */
export function TokenCookieSync() {
  useEffect(() => {
    const t = getStoredAccessToken();
    if (t) syncAccessTokenToCookie(t);
  }, []);
  return null;
}
