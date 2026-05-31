import { ShareAttemptClient } from "@/components/share-attempt-client";

export default async function SharePage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <ShareAttemptClient attemptId={attemptId} />;
}

