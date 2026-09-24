import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { resolveMediaUrl, type Ship } from "../api/encyclopedia";

type ShipDetailsDialogProps = {
  ship: Ship | null;
  mediaPath: string;
  onClose: () => void;
};

export function ShipDetailsDialog({ ship, mediaPath, onClose }: ShipDetailsDialogProps) {
  const displayName = ship?.localization.shortmark.en ?? ship?.name;

  return (
    <Dialog open={ship !== null} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 overflow-y-auto p-6">
        <DialogPanel className="mx-auto w-full max-w-5xl space-y-6 rounded-lg bg-white p-6 shadow-xl">
          <DialogTitle as="h1" className="text-2xl font-bold text-slate-900">
            {displayName}
          </DialogTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(ship?.icons ?? {}).map(([name, path]) => (
              <figure key={name} className="min-w-0 space-y-2 rounded-lg border border-slate-200 p-3">
                <figcaption className="font-mono text-sm font-semibold">{name}</figcaption>
                {name.startsWith("local_") ? (
                  <p className="text-sm text-slate-500">Game-local asset; no web preview available.</p>
                ) : (
                  <a
                    href={resolveMediaUrl(mediaPath, path)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-32 items-center justify-center rounded bg-slate-700 p-3"
                  >
                    <img
                      src={resolveMediaUrl(mediaPath, path)}
                      alt={`${displayName} — ${name}`}
                      className="max-h-64 max-w-full object-contain"
                    />
                  </a>
                )}
                <p className="break-all font-mono text-xs text-slate-500">{path}</p>
              </figure>
            ))}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
