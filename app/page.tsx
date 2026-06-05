import { generatedProblemBatch001Classifications } from "@/data/generated-problem-batch-001";
import { problems } from "@/data/problems";
import { AuthNotice } from "@/components/auth-notice";
import { AuthoredProblemList } from "@/components/authored-problem-list";
import { HomeHero } from "@/components/home-hero";
import { ProblemBrowser } from "@/components/problem-browser";

type HomePageProps = {
  searchParams?: Promise<{
    auth?: string;
    message?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  return (
    <main className="container ui-mode-surface" data-ui-mode="human">
      <HomeHero firstProblemHref={`/problems/${problems[0].id}`} />
      <AuthNotice auth={params?.auth} message={params?.message} />

      <ProblemBrowser problems={problems} classifications={generatedProblemBatch001Classifications} />

      <AuthoredProblemList />
    </main>
  );
}
