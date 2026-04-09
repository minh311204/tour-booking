"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import {
  getMe,
  postLogin,
  postOAuthFacebook,
  postOAuthGoogle,
} from "@/lib/client-auth";
import { setUserEmail } from "@/lib/auth-storage";
import { errorMessage } from "@/lib/format";

declare global {
  interface Window {
    FB?: {
      init: (config: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          authResponse?: { accessToken: string };
          status?: string;
        }) => void,
        opts: { scope: string },
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

function useFacebookSdk(appId: string | undefined) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!appId) return;

    if (typeof window === "undefined") return;

    const done = () => setReady(true);

    if (window.FB) {
      done();
      return;
    }

    window.fbAsyncInit = function () {
      window.FB?.init({
        appId,
        cookie: true,
        xfbml: true,
        version: "v21.0",
      });
      done();
    };

    const existing = document.getElementById("facebook-jssdk");
    if (!existing) {
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/vi_VN/sdk.js";
      js.async = true;
      js.defer = true;
      document.body.appendChild(js);
    }
  }, [appId]);

  return ready;
}

async function persistSessionAndRedirect(
  accessToken: string,
  refreshToken: string,
  router: ReturnType<typeof useRouter>,
) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  const me = await getMe(accessToken);
  if (me.ok) {
    setUserEmail(me.data.email);
  }
  router.push("/");
  router.refresh();
}

function LoginForm() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? "";
  const fbReady = useFacebookSdk(fbAppId || undefined);

  const onFacebookClick = useCallback(() => {
    if (!window.FB) {
      setErr("SDK Facebook chưa tải xong. Thử lại sau vài giây.");
      return;
    }
    setErr(null);
    window.FB.login(
      (response) => {
        const token = response.authResponse?.accessToken;
        if (!token) {
          setErr("Đăng nhập Facebook bị hủy hoặc thiếu quyền.");
          return;
        }
        setLoading(true);
        void (async () => {
          try {
            const res = await postOAuthFacebook(token);
            if (res.ok) {
              await persistSessionAndRedirect(
                res.data.accessToken,
                res.data.refreshToken,
                router,
              );
              return;
            }
            setErr(errorMessage(res.body));
          } catch {
            setErr("Không kết nối được API.");
          } finally {
            setLoading(false);
          }
        })();
      },
      { scope: "email,public_profile" },
    );
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const emailVal = String(fd.get("email") ?? "").trim();
    const passwordVal = String(fd.get("password") ?? "");
    setLoading(true);
    try {
      const res = await postLogin(emailVal, passwordVal);
      if (res.ok) {
        await persistSessionAndRedirect(
          res.data.accessToken,
          res.data.refreshToken,
          router,
        );
        return;
      }
      setErr(errorMessage(res.body));
    } catch {
      setErr("Không kết nối được API. Kiểm tra NEXT_PUBLIC_API_URL và backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-center text-2xl font-bold text-stone-900">
        Đăng nhập
      </h1>
      <p className="mt-2 text-center text-sm text-stone-600">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="font-semibold text-teal-700 hover:underline"
        >
          Đăng ký
        </Link>
      </p>

      {(googleClientId || fbAppId) && (
        <div className="mt-8 space-y-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-center text-sm font-medium text-stone-700">
            Đăng nhập nhanh
          </p>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            {googleClientId ? (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    const idToken = credentialResponse.credential;
                    if (!idToken) {
                      setErr("Google không trả token. Thử lại.");
                      return;
                    }
                    setErr(null);
                    setLoading(true);
                    try {
                      const res = await postOAuthGoogle(idToken);
                      if (res.ok) {
                        await persistSessionAndRedirect(
                          res.data.accessToken,
                          res.data.refreshToken,
                          router,
                        );
                        return;
                      }
                      setErr(errorMessage(res.body));
                    } catch {
                      setErr("Không kết nối được API.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onError={() => setErr("Đăng nhập Google thất bại.")}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                />
              </div>
            ) : null}
            {fbAppId ? (
              <button
                type="button"
                disabled={!fbReady || loading}
                onClick={onFacebookClick}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:opacity-60"
              >
                Facebook
              </button>
            ) : null}
          </div>
        </div>
      )}

      <form
        className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        onSubmit={onSubmit}
      >
        {err ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {err}
          </p>
        ) : null}
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-stone-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-stone-700"
          >
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <LoginForm />
      </GoogleOAuthProvider>
    );
  }
  return <LoginForm />;
}
