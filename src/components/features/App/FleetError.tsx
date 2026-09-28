import { CommandButton } from "@/components/ui/command-button";
import { FleetMessage } from "./FleetMessage";

export function FleetError({ onRetry }: { onRetry: () => void }) {
  return (
    <FleetMessage
      icon="anchor"
      title="Unable to load the fleet"
      description="The encyclopedia couldn’t be reached. Try again in a moment."
      role="alert"
    >
      <CommandButton onClick={onRetry}>Try again</CommandButton>
    </FleetMessage>
  );
}
