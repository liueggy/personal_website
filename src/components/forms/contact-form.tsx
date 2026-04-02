"use client";

import { useState } from "react";

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        name: formData.get("name"),
        email: formData.get("email"),
        subject: formData.get("subject"),
        message: formData.get("message")
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const raw = await response.text();
      const result = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        setError(result.error || "提交失败");
        return;
      }

      setMessage("留言已提交，我会尽快回复。");
      const form = document.getElementById("contact-form") as HTMLFormElement | null;
      form?.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      id="contact-form"
      className="stack-form"
      onSubmit={async (event) => {
        event.preventDefault();
        await handleSubmit(new FormData(event.currentTarget));
      }}
    >
      <label>
        <span>姓名</span>
        <input name="name" type="text" placeholder="LiuEggy" required minLength={2} />
      </label>
      <label>
        <span>邮箱</span>
        <input name="email" type="email" placeholder="you@example.com" required />
      </label>
      <label>
        <span>主题</span>
        <input name="subject" type="text" placeholder="合作、交流或提问" />
      </label>
      <label>
        <span>内容</span>
        <textarea name="message" rows={8} placeholder="请描述你的问题或合作方向。" required minLength={10} />
      </label>
      <button type="submit" className="button-primary" disabled={pending}>
        {pending ? "提交中..." : "发送留言"}
      </button>
      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
