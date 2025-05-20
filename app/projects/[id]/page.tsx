import { AppLayout } from "@/components/app-layout";
import { ProjectDetail } from "@/components/project-detail";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  return (
    <AppLayout data-oid="e2w5:q8">
      <ProjectDetail projectId={id} data-oid="2hjw_6l" />
    </AppLayout>
  );
}
