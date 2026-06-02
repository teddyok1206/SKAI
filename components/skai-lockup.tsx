import { SkaiMark } from "@/components/skai-mark";

type SkaiLockupProps = {
  mode?: "human" | "engine";
  compact?: boolean;
};

export function SkaiLockup({ mode = "human", compact = false }: SkaiLockupProps) {
  return (
    <div className={`skai-lockup ${mode} ${compact ? "compact" : ""}`} aria-label="SKAI Social Knowledge of AI">
      <span className="skai-lockup-mark" aria-hidden="true">
        <SkaiMark size={compact ? 24 : 34} />
      </span>
      <span className="skai-lockup-copy">
        <strong>SKAI</strong>
        <small>Social Knowledge of AI</small>
      </span>
    </div>
  );
}
