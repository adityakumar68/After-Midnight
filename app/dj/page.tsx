import { Suspense } from "react";
import StudioClient from "@/components/game/StudioClient";
export default function DjPage() {
  return (
    <Suspense>
      <StudioClient />
    </Suspense>
  );
}
