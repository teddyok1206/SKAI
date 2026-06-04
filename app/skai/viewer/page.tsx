import { SkaiFileViewer } from "@/components/skai-file-viewer";
import { SkaiViewerPageHeader } from "@/components/skai-viewer-page-header";

export default function SkaiViewerPage() {
  return (
    <main className="container ui-mode-surface" data-ui-mode="engine">
      <SkaiViewerPageHeader />
      <SkaiFileViewer allowImport />
    </main>
  );
}
