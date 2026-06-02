import { LocalProblemSolver } from "@/components/local-problem-solver";

export default async function LocalProblemPage({ params }: { params: Promise<{ problemId: string }> }) {
  const { problemId } = await params;

  return (
    <main className="container">
      <LocalProblemSolver problemId={problemId} />
    </main>
  );
}
