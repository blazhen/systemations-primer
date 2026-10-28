import { createFileRoute } from "@tanstack/react-router";
import { WatchBeforeYourCallPage } from "../components/WatchBeforeYourCallPage";
import { buildHead } from "../lib/seo";

export const Route = createFileRoute("/watch-before-your-call")({
  head: () =>
    buildHead({
      title: "Watch Before Your Call | Systemations",
      description:
        "Your call is booked. Watch this short message from Dan, founder of Systemations, so we can spend our time together on your business instead of the basics.",
      path: "/watch-before-your-call",
      // Same page as "/", so point search engines at "/" to avoid duplicate content.
      canonicalPath: "/",
    }),
  component: WatchBeforeRoutePage,
});

function WatchBeforeRoutePage() {
  return <WatchBeforeYourCallPage />;
}
