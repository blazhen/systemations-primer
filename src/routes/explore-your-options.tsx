import { createFileRoute } from "@tanstack/react-router";
import { ExploreYourOptionsPage } from "../components/ExploreYourOptionsPage";
import { buildHead } from "../lib/seo";

export const Route = createFileRoute("/explore-your-options")({
  head: () =>
    buildHead({
      title: "Explore Your Options | Systemations",
      description:
        "See what an AI operations system could do for your small business before your call. Try guided examples of enquiries, quotes, follow-up and admin running on their own.",
      path: "/explore-your-options",
    }),
  component: ExploreRoutePage,
});

function ExploreRoutePage() {
  return <ExploreYourOptionsPage />;
}
