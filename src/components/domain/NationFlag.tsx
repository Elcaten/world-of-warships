import {
  resolveMediaUrl,
  useMediaPathQuery,
  useNationsQuery,
} from "@/api/encyclopedia";
import type { ImgHTMLAttributes } from "react";

type NationFlagProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt"
> & {
  nation: string;
  size?: "tiny" | "small" | "large";
};

export function NationFlag({
  nation: nationName,
  size = "small",
  ...imageProps
}: NationFlagProps) {
  const nations = useNationsQuery();
  const mediaPath = useMediaPathQuery();
  const nation = nations.data?.find(({ name }) => name === nationName);

  if (!nation || !mediaPath.data) return null;

  return (
    <img
      {...imageProps}
      src={resolveMediaUrl(mediaPath.data, nation.icons[size])}
      alt={`${nation.localization.mark.en ?? nation.name} flag`}
    />
  );
}
