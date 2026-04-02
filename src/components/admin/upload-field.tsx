"use client";

import { useRef, useState } from "react";

type UploadFieldProps = {
  bucket: "post-covers" | "project-assets" | "site-assets";
  value: string;
  onChange: (value: string) => void;
};

export function UploadField({ bucket, value, onChange }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setPending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("bucket", bucket);
      formData.set("file", file);

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData
      });
      const raw = await response.text();
      const result = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        setError(result.error || "上传失败");
        return;
      }

      onChange(result.data.publicUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="upload-field">
      <div className="inline-actions">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://..." />
        <button type="button" className="button-secondary" onClick={() => inputRef.current?.click()} disabled={pending}>
          {pending ? "上传中..." : "上传文件"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void uploadFile(file);
          }
        }}
      />
      {error ? <p className="form-error">{error}</p> : null}
      {value ? (
        <div className="upload-preview">
          <img src={value} alt="Uploaded preview" />
        </div>
      ) : null}
    </div>
  );
}
