import type { SVGProps } from "react";

const paths = {
  anchor:
    "M12 3v16m-4-8h8M5 14H2c0 5 4 8 10 8s10-3 10-8h-3M9 5a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  search: "M21 21l-6-6M17 10a7 7 0 1 1-14 0a7 7 0 0 1 14 0",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  table: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18",
  reset: "M3 10a9 9 0 1 1 2 8M3 3v7h7",
  close: "M6 6l12 12M18 6 6 18",
  left: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
  flag: "M5 22V3l7 2 7-2v11l-7 2-7-2",
  tier: "M8 3h8v8l-4 4-4-4zM12 15v6M8 21h8M12 3v8",
  source: "M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16",
};

export function Icon({
  name,
  ...props
}: { name: keyof typeof paths } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
