import { createFileRoute } from "@tanstack/react-router";
import { WatchBeforeYourCallPage } from "../components/WatchBeforeYourCallPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Watch before your call - Systemations" },
      {
        name: "description",
        content:
          "Your call is booked. Watch this short message from Dan, our founder, before we speak.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Watch before your call - Systemations" },
      {
        property: "og:description",
        content:
          "Your call is booked. Watch this short message from Dan, our founder, before we speak.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  return <WatchBeforeYourCallPage />;
}
