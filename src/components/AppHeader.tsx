import { Icon } from "./ui/icon";

export function AppHeader() {
  return (
    <header className="border-b border-fleet-line bg-linear-to-b from-[#232c33] to-[#0b141a] shadow-[0_5px_20px_#0003]">
      <a
        href="#main-content"
        className="absolute -top-25 left-4 z-100 bg-fleet-cyan p-3 text-fleet-on-cyan focus:top-3"
      >
        Skip to fleet
      </a>
      <div className="mx-auto w-[calc(100%-32px)] sm:w-[calc(100%-48px)] lg:w-[min(100%-80px,1536px)] flex min-h-18 items-center justify-between gap-2 sm:min-h-20 sm:gap-5">
        <a
          className="flex items-center gap-2.5 font-heading text-[15px] leading-normal font-bold tracking-[0.035em] uppercase sm:text-[17px] md:gap-4 md:text-[21px]"
          href="./"
          aria-label="Warship Encyclopedia home"
        >
          <span className="grid h-9 w-7.5 place-items-center border border-fleet-cyan bg-fleet-cyan/6 text-fleet-cyan [clip-path:polygon(50%_0,100%_23%,100%_77%,50%_100%,0_77%,0_23%)] sm:h-10.5 sm:w-9.5 [&>svg]:size-6">
            <Icon name="anchor" />
          </span>
          <span className="flex flex-col sm:block">
            Warship <span className="text-fleet-highlight">Encyclopedia</span>
          </span>
        </a>
        <a
          className="inline-flex min-h-10 items-center justify-center gap-2 border border-[#3c4948] bg-[#121a21]/60 p-2 font-mono text-xs font-medium tracking-[0.05em] text-fleet-secondary uppercase hover:border-fleet-cyan hover:bg-[#263b42] hover:text-fleet-highlight sm:px-[13px]"
          href="https://github.com/Elcaten/world-of-warships"
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="source" />
          <span className="hidden sm:inline">Source</span>
        </a>
      </div>
    </header>
  );
}
