import { Logo } from "@/components/ui/logo";

export function AppHeader() {
  return (
    <header className="border-fleet-line bg-fleet-panel border-b">
      <a
        href="#main-content"
        className="bg-fleet-cyan text-fleet-on-cyan sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50 focus:p-3"
      >
        Skip to fleet
      </a>
      <div className="mx-auto flex max-w-384 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <a
          className="font-heading flex items-center gap-3 font-medium uppercase sm:text-xl"
          href="./"
          aria-label="Warship Encyclopedia home"
        >
          <Logo.Wow className="size-8 shrink-0" />
          <span>
            Warship <span className="text-fleet-highlight">Encyclopedia</span>
          </span>
        </a>
        <a
          className="text-fleet-secondary hover:text-fleet-highlight flex items-center gap-2 p-2 font-mono text-xs uppercase"
          href="https://github.com/Elcaten/world-of-warships"
          aria-label="Source on GitHub"
          target="_blank"
          rel="noreferrer"
        >
          <Logo.GitHub className="size-4" />
          <span className="hidden sm:inline">Source</span>
        </a>
      </div>
    </header>
  );
}
