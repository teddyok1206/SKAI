export function SkaiMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="skai-mark"
      fill="none"
      height={size}
      viewBox="0 0 48 32"
      width={Math.round(size * 1.5)}
    >
      <path className="skai-mark-edge" d="M12 9.5H25.5C30.8 9.5 33.4 13.4 37 16" />
      <path className="skai-mark-edge" d="M12 22.5H25.5C30.8 22.5 33.4 18.6 37 16" />
      <path className="skai-mark-arrow" d="M36.5 11.8L42 16L36.5 20.2" />
      <circle className="skai-mark-artifact-halo" cx="39.5" cy="16" r="7.2" />
      <circle className="skai-mark-packet skai-mark-packet-top" cx="14" cy="9.5" r="1.5" />
      <circle className="skai-mark-packet skai-mark-packet-bottom" cx="14" cy="22.5" r="1.5" />
      <circle className="skai-mark-packet skai-mark-packet-top skai-mark-packet-secondary" cx="14" cy="9.5" r="1.15" />
      <circle className="skai-mark-packet skai-mark-packet-bottom skai-mark-packet-secondary" cx="14" cy="22.5" r="1.15" />
      <circle className="skai-mark-spark skai-mark-spark-mid" cx="24" cy="16" r="1" />
      <circle className="skai-mark-node skai-mark-node-circle" cx="9.5" cy="9.5" r="4.2" />
      <circle className="skai-mark-node skai-mark-node-circle" cx="9.5" cy="22.5" r="4.2" />
      <circle className="skai-mark-node skai-mark-node-circle skai-mark-artifact-node" cx="39.5" cy="16" r="4.2" />
      <path className="skai-mark-node skai-mark-node-hex" d="M9.5 5.3L13.2 7.4V11.6L9.5 13.7L5.8 11.6V7.4L9.5 5.3Z" />
      <path className="skai-mark-node skai-mark-node-hex" d="M9.5 18.3L13.2 20.4V24.6L9.5 26.7L5.8 24.6V20.4L9.5 18.3Z" />
      <path className="skai-mark-node skai-mark-node-hex skai-mark-artifact-node" d="M39.5 11.8L43.2 13.9V18.1L39.5 20.2L35.8 18.1V13.9L39.5 11.8Z" />
    </svg>
  );
}
