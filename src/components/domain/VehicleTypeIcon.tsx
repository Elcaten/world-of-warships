import type { ImgHTMLAttributes } from "react";
import {
  resolveMediaUrl,
  useMediaPath,
  useVehicleTypes,
} from "@/api/encyclopedia";

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
  const vehicleTypes = useVehicleTypes();
  const mediaPath = useMediaPath();
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
