import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/app-layout";

function ProjectsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {/* Título "Proyectos" Skeleton */}
        <Skeleton className="h-8 w-1/4" />
        <div className="flex gap-2">
          {/* Botón "Ver tareas" Skeleton */}
          <Skeleton className="h-9 w-24" />
          {/* Botón "Mostrar archivados" Skeleton */}
          <Skeleton className="h-9 w-9" />
          {/* Botón "Nuevo Proyecto" Skeleton */}
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Mostrar 3 tarjetas esqueleto como ejemplo */}
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              {/* Nombre Proyecto Skeleton */}
              <Skeleton className="h-5 w-3/4 mb-1" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                {/* tareas Skeleton */}
                <Skeleton className="h-4 w-16" />
                {/* % completado Skeleton */}
                <Skeleton className="h-4 w-24" />
              </div>
              {/* Barra progreso Skeleton */}
              <Skeleton className="h-1 w-full rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  // Envolver el esqueleto con AppLayout para que la transición sea más fluida
  // y no haya saltos de layout.
  return (
    <AppLayout>
      <ProjectsSkeleton />
    </AppLayout>
  );
}
