import { GithubLogo } from "./ui/github-logo";
import { WoWLogo } from "./ui/wow-logo";

export function AppHeader() {
  return (
    <header className="border-b border-fleet-line bg-fleet-panel">
      <a
        href="#main-content"
        className="sr-only bg-fleet-cyan text-fleet-on-cyan focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50 focus:p-3"
      >
        Skip to fleet
      </a>
      <div className="mx-auto flex max-w-384 items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10">
        <a
          className="flex items-center gap-3 font-heading font-bold uppercase sm:text-xl"
          href="./"
          aria-label="Warship Encyclopedia home"
        >
          <WoWLogo className="size-8 shrink-0" />
          <span className="flex flex-col sm:block">
            Warship <span className="text-fleet-highlight">Encyclopedia</span>
          </span>
        </a>
        <a
          className="flex items-center gap-2 p-2 font-mono text-xs text-fleet-secondary uppercase hover:text-fleet-highlight"
          href="https://github.com/Elcaten/world-of-warships"
          aria-label="Source on GitHub"
          target="_blank"
          rel="noreferrer"
        >
          <GithubLogo className="size-4" />
          <span className="hidden sm:inline">Source</span>
        </a>
      </div>
    </header>
  );
}
