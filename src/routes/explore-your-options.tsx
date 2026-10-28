import { createFileRoute } from "@tanstack/react-router";
import { ExploreYourOptionsPage } from "../components/ExploreYourOptionsPage";

export const Route = createFileRoute("/explore-your-options")({
  head: () => ({
    meta: [
      { title: "Explore your options - Systemations" },
      {
        name: "description",
        content:
          "Before your Explore Your Options call, see what is possible. Try guided examples of enquiries, follow-up and admin running in your business.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Explore your options - Systemations" },
      {
        property: "og:description",
        content:
          "Before your Explore Your Options call, see what is possible. Try guided examples of enquiries, follow-up and admin running in your business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExploreRoutePage,
});

function ExploreRoutePage() {
  return <ExploreYourOptionsPage />;
}
