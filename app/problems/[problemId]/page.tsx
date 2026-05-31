import { notFound } from "next/navigation";
import { getProblem } from "@/data/problems";
import { ProblemSolver } from "@/components/problem-solver";

export default async function ProblemPage({ params }: { params: Promise<{ problemId: string }> }) {
  const { problemId } = await params;
  const problem = getProblem(problemId);

  if (!problem) {
    notFound();
  }

  return (
    <main className="container">
      <ProblemSolver problem={problem} />
    </main>
  );
}

