import { LoginForm } from "@/components/forms/login-form";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next || "/admin";
  const error =
    params.error === "forbidden"
      ? "当前账号没有后台权限。"
      : params.error === "auth"
        ? "登录失败，请重试。"
        : null;

  return (
    <main>
      <section className="section">
        <div className="shell page-grid">
          <div className="detail-card">
            <span className="eyebrow">Admin Access</span>
            <h1 className="page-title">管理员登录</h1>
            <p className="page-lead">使用管理员邮箱和密码直接登录，若忘记密码可在右侧发送重置邮件。</p>
            {error ? <p className="form-error">{error}</p> : null}
          </div>
          <div className="detail-card">
            <LoginForm nextPath={nextPath} />
          </div>
        </div>
      </section>
    </main>
  );
}
