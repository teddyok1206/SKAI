import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { generatedProblemBatch001Classifications } from "@/data/generated-problem-batch-001";
import { problems } from "@/data/problems";
import { AuthoredProblemList } from "@/components/authored-problem-list";
import { ProblemBrowser } from "@/components/problem-browser";

type HomePageProps = {
  searchParams?: Promise<{
    auth?: string;
    message?: string;
  }>;
};

function authNotice(auth?: string, message?: string) {
  if (!auth) {
    return null;
  }

  if (auth === "missing_code") {
    return "로그인 callback에 인증 코드가 없습니다. Google 로그인을 다시 시도해 주세요.";
  }

  if (auth === "not_configured") {
    return "Supabase 환경 변수가 없어 Google 로그인을 사용할 수 없습니다.";
  }

  if (auth === "error") {
    return message ? `Google 로그인 실패: ${message}` : "Google 로그인에 실패했습니다.";
  }

  return null;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const notice = authNotice(params?.auth, params?.message);

  return (
    <main className="container ui-mode-surface" data-ui-mode="human">
      <section className="home-hero">
        <h1>
          불꽃은 주어졌습니다.
          <br />
          이제 당신의 장작을 넣을 차례입니다.
        </h1>
        <div className="hero-actions">
          <Link className="button primary" href={`/problems/${problems[0].id}`}>
            첫 문제 풀기 <ArrowRight size={17} />
          </Link>
          <a className="button quiet" href="#problems">
            문제 보기
          </a>
        </div>
      </section>
      {notice ? <p className="auth-notice">{notice}</p> : null}

      <ProblemBrowser
        problems={problems}
        classifications={generatedProblemBatch001Classifications}
        generatedProblemIds={Object.keys(generatedProblemBatch001Classifications)}
      />

      <AuthoredProblemList />
    </main>
  );
}
