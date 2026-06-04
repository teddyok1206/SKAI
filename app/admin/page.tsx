import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminAuthoringClient } from "@/components/admin-authoring-client";
import { FounderReviewDashboard } from "@/components/founder-review-dashboard";
import { GeneratedProblemEditorialDashboard } from "@/components/generated-problem-editorial-dashboard";

export default function AdminPage() {
  return (
    <main className="container ui-mode-surface" data-ui-mode="human">
      <AdminPageHeader />
      <AdminAuthoringClient />
      <GeneratedProblemEditorialDashboard />
      <FounderReviewDashboard />
    </main>
  );
}
