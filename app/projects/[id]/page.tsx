import { AppLayout } from "@/components/app-layout";
import { ProjectDetail } from "@/components/project-detail";

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <AppLayout data-oid="e2w5:q8">
      <ProjectDetail projectId={params.id} data-oid="2hjw_6l" />
    </AppLayout>
  );
}
