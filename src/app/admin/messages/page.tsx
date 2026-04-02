import { requireAdminUser } from "@/lib/auth";
import { listMessages } from "@/lib/content";
import { formatDate } from "@/lib/utils";

export default async function AdminMessagesPage() {
  await requireAdminUser();
  const messages = await listMessages();

  return (
    <main>
      <section className="section">
        <div className="shell">
          <h1 className="page-title">联系表单留言</h1>
          <div className="admin-list">
            {messages.map((message) => (
              <article key={message.id} className="panel">
                <div className="panel-header">
                  <div>
                    <h2>{message.subject || "未填写主题"}</h2>
                    <p>
                      {message.name} · {message.email}
                    </p>
                  </div>
                  <span>{formatDate(message.created_at)}</span>
                </div>
                <p>{message.message}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
