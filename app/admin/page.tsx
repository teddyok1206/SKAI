import { AdminAuthoringClient } from "@/components/admin-authoring-client";
import { FounderReviewDashboard } from "@/components/founder-review-dashboard";

export default function AdminPage() {
  return (
    <main className="container">
      <section className="page-header">
        <div>
          <p className="eyebrow">Admin MVP</p>
          <h1>문제를 만들고 바로 풀어본다.</h1>
          <p className="lead">
            SKAI 문제는 현실의 애매함, 자료, 제약, 산출물, 검증 기준을 함께 담아야 한다.
          </p>
        </div>
      </section>

      <AdminAuthoringClient />
      <FounderReviewDashboard />
    </main>
  );
}
