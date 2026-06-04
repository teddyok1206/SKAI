import { SkaiFileViewer } from "@/components/skai-file-viewer";

export default function SkaiViewerPage() {
  return (
    <main className="container ui-mode-surface" data-ui-mode="engine">
      <section className="page-header">
        <div>
          <p className="eyebrow">SKAI File</p>
          <h1>.skai Viewer</h1>
          <p className="lead">하나의 viewer에서 SKAI graph artifact를 열고, 저장하고, 공유하고, PDF로 출력합니다.</p>
        </div>
      </section>
      <SkaiFileViewer allowImport title="SKAI File Viewer" />
    </main>
  );
}
