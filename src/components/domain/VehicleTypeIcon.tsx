import {
  resolveMediaUrl,
  useMediaPathQuery,
  useVehicleTypesQuery,
} from "@/api/encyclopedia";
import type { ImgHTMLAttributes } from "react";

type VehicleTypeIconProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt"
> & {
  vehicleType: string;
  variant?: "default" | "premium";
};

export function VehicleTypeIcon({
  vehicleType: vehicleTypeName,
  variant = "default",
  ...imageProps
}: VehicleTypeIconProps) {
  const vehicleTypes = useVehicleTypesQuery();
  const mediaPath = useMediaPathQuery();
  const vehicleType = vehicleTypes.data?.[vehicleTypeName];

  if (!vehicleType || !mediaPath.data) return null;

  return (
    <img
      {...imageProps}
      src={resolveMediaUrl(mediaPath.data, vehicleType.icons[variant])}
      alt={vehicleType.localization.mark.en ?? vehicleTypeName}
    />
  );
}
