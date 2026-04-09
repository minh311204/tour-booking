/** Dùng chung cho client-auth, middleware và đồng bộ cookie. */

export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";

/** Cookie tên riêng admin — middleware đọc để cho phép vào dashboard (song song với localStorage). */
export const AUTH_COOKIE_NAME = "admin_access_token";
