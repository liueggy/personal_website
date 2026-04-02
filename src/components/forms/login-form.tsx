"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      const supabase = createSupabaseBrowserClient();

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "登录失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  async function sendResetEmail(email: string) {
    setResetPending(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = new URL("/admin/reset-password", window.location.origin);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo.toString()
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage("重置邮件已发送，请前往邮箱完成后续操作。");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "发送重置邮件失败");
    } finally {
      setResetPending(false);
    }
  }

  return (
    <form
      className="stack-form"
      onSubmit={async (event) => {
        event.preventDefault();
        await handleSubmit(new FormData(event.currentTarget));
      }}
    >
      <label>
        <span>管理员邮箱</span>
        <input id="admin-email" name="email" type="email" placeholder="admin@liueggy.live" required />
      </label>
      <label>
        <span>密码</span>
        <input name="password" type="password" placeholder="输入管理员密码" required minLength={6} />
      </label>
      <button type="submit" className="button-primary" disabled={pending}>
        {pending ? "登录中..." : "进入后台"}
      </button>
      <button
        type="button"
        className="button-secondary"
        disabled={resetPending}
        onClick={() => {
          const emailInput = document.getElementById("admin-email") as HTMLInputElement | null;
          const email = emailInput?.value?.trim() || "";
          if (!email) {
            setError("请先输入管理员邮箱。");
            return;
          }
          void sendResetEmail(email);
        }}
      >
        {resetPending ? "发送中..." : "重置密码"}
      </button>
      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
