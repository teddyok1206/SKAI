import { FilePlus2, ShieldCheck, Workflow } from "lucide-react";

const adminItems = [
  {
    icon: FilePlus2,
    title: "문제 출제",
    body: "MVP에서는 seed file로 시작하고, 이후 Supabase 기반 create/edit/publish 화면으로 확장한다.",
  },
  {
    icon: Workflow,
    title: "Rubric 관리",
    body: "문제별 공개 rubric, goal profile, 허용 모델, starter material을 관리한다.",
  },
  {
    icon: ShieldCheck,
    title: "검증 모드",
    body: "수료/채용/인증 모드에서는 유사도 검증, 재채점 기록, judge versioning을 추가한다.",
  },
];

export default function AdminPage() {
  return (
    <main className="container">
      <section className="page-header">
        <div>
          <p className="eyebrow">Admin MVP</p>
          <h1>문제 출제와 평가 기준은 제품의 핵심 데이터다.</h1>
          <p className="lead">
            첫 데모에서는 읽기 전용 placeholder로 두고, Supabase schema가 붙으면 관리자 authoring surface로 확장한다.
          </p>
        </div>
      </section>

      <section className="grid">
        {adminItems.map((item) => {
          const Icon = item.icon;
          return (
            <article className="card problem-card" key={item.title}>
              <div>
                <span className="brand-mark" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <h2 style={{ marginTop: 14 }}>{item.title}</h2>
                <p className="muted">{item.body}</p>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

