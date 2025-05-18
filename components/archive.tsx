export function Archive() {
  return (
    <div className="space-y-6" data-oid="m987rp7">
      <h1 className="text-2xl font-bold" data-oid="7h0u42:">
        Archivo
      </h1>
      <p className="text-muted-foreground" data-oid="yf2cnq_">
        Aquí encontrarás tus notas y recursos guardados.
      </p>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        data-oid="llmbhz-"
      >
        {/* Placeholder for archived items */}
        <div
          className="border border-border rounded-md p-4 bg-card/50 flex items-center justify-center h-40"
          data-oid="phwohvu"
        >
          <p className="text-muted-foreground text-sm" data-oid="5qz14h0">
            No hay elementos archivados
          </p>
        </div>
      </div>
    </div>
  );
}
