import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { isDemoAuthenticated } from "@/lib/demo-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ location }) => {
    if (!isDemoAuthenticated()) {
      throw redirect({ to: "/auth", search: { mode: "login", redirect: location.href } });
    }
  },
  component: () => <Outlet />,
});
