import type { ImgHTMLAttributes } from "react";
import {
  resolveMediaUrl,
  useMediaPath,
  useVehicleTypes,
} from "../api/encyclopedia";

type VehicleTypeIconProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt"
> & {
  vehicleType: string;
};

export function VehicleTypeIcon({
  vehicleType: vehicleTypeName,
  ...imageProps
}: VehicleTypeIconProps) {
  const vehicleTypes = useVehicleTypes();
  const mediaPath = useMediaPath();
  const vehicleType = vehicleTypes.data?.[vehicleTypeName];

  if (!vehicleType || !mediaPath.data) return null;

  return (
    <img
      {...imageProps}
      src={resolveMediaUrl(mediaPath.data, vehicleType.icons.default)}
      alt={vehicleType.localization.mark.en ?? vehicleTypeName}
    />
  );
}
