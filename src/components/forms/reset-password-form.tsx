"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const password = String(formData.get("password") || "");
      const confirmPassword = String(formData.get("confirmPassword") || "");

      if (password.length < 6) {
        setError("新密码至少需要 6 位。");
        return;
      }

      if (password !== confirmPassword) {
        setError("两次输入的密码不一致。");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setMessage("密码已更新，正在进入后台。");
      window.setTimeout(() => {
        router.replace("/admin");
        router.refresh();
      }, 600);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "密码更新失败，请稍后重试");
    } finally {
      setPending(false);
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
        <span>新密码</span>
        <input name="password" type="password" placeholder="至少 6 位" required minLength={6} />
      </label>
      <label>
        <span>确认新密码</span>
        <input name="confirmPassword" type="password" placeholder="再次输入新密码" required minLength={6} />
      </label>
      <button type="submit" className="button-primary" disabled={pending}>
        {pending ? "更新中..." : "设置新密码"}
      </button>
      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
