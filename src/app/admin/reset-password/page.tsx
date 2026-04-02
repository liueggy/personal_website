import { ResetPasswordForm } from "@/components/forms/reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const error = params.error === "auth" ? "重置链接无效或已过期，请重新申请。" : null;

  return (
    <main>
      <section className="section">
        <div className="shell page-grid">
          <div className="detail-card">
            <span className="eyebrow">Password Reset</span>
            <h1 className="page-title">设置新密码</h1>
            <p className="page-lead">验证通过后，直接在这里完成管理员密码重置。</p>
            {error ? <p className="form-error">{error}</p> : null}
          </div>
          <div className="detail-card">
            <ResetPasswordForm />
          </div>
        </div>
      </section>
    </main>
  );
}
