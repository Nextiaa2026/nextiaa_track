export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-lg border p-6 text-center">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to access this page.
        </p>
      </div>
    </div>
  );
}

