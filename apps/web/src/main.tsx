import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { lazy, StrictMode, Suspense } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app";
import { PageLoading } from "@/components/page-loading";
import { HomePage } from "@/pages/home";

import "@/styles/globals.css";

const ClassRecommendPage = lazy(
  async () =>
    await import("@/pages/tools/class-recommend").then((module) => ({
      default: module.ClassRecommendPage,
    }))
);

const LocationSimulationTutorialPage = lazy(
  async () =>
    await import("@/pages/tools/chaoxing-location-tutorial").then((module) => ({
      default: module.LocationSimulationTutorialPage,
    }))
);

const LeaveSlipPage = lazy(
  async () =>
    await import("@/pages/tools/leave-slip").then((module) => ({
      default: module.LeaveSlipPage,
    }))
);

const NewsPage = lazy(
  async () =>
    await import("@/pages/tools/news").then((module) => ({
      default: module.NewsPage,
    }))
);

const CampusLoginPage = lazy(
  async () =>
    await import("@/pages/tools/campus-login").then((module) => ({
      default: module.CampusLoginPage,
    }))
);

const FoodMapPage = lazy(
  async () =>
    await import("@/pages/tools/food-map").then((module) => ({
      default: module.FoodMapPage,
    }))
);

const JoinUsPage = lazy(
  async () =>
    await import("@/pages/site/joinus").then((module) => ({
      default: module.JoinUsPage,
    }))
);

const PrivacyPage = lazy(
  async () =>
    await import("@/pages/site/privacy").then((module) => ({
      default: module.PrivacyPage,
    }))
);

const TermsPage = lazy(
  async () =>
    await import("@/pages/site/terms").then((module) => ({
      default: module.TermsPage,
    }))
);

const UpdatesPage = lazy(
  async () =>
    await import("@/pages/site/updates").then((module) => ({
      default: module.UpdatesPage,
    }))
);

const CommentsPage = lazy(
  async () =>
    await import("@/pages/comments").then((module) => ({
      default: module.CommentsPage,
    }))
);

const NotFoundPage = lazy(
  async () =>
    await import("@/pages/not-found").then((module) => ({
      default: module.NotFoundPage,
    }))
);

const queryClient = new QueryClient();

const LazyPage = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<PageLoading />}>{children}</Suspense>
);

const rootRoute = createRootRoute({
  component: App,
  notFoundComponent: () => (
    <LazyPage>
      <NotFoundPage />
    </LazyPage>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const classRecommendRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tools/class-recommend",
  component: () => (
    <LazyPage>
      <ClassRecommendPage />
    </LazyPage>
  ),
});

const locationSimulationTutorialRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tools/location-simulation-tutorial",
  component: () => (
    <LazyPage>
      <LocationSimulationTutorialPage />
    </LazyPage>
  ),
});

const leaveSlipRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tools/leave-slip",
  component: () => (
    <LazyPage>
      <LeaveSlipPage />
    </LazyPage>
  ),
});

const newsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tools/news",
  component: () => (
    <LazyPage>
      <NewsPage />
    </LazyPage>
  ),
});

const campusLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tools/campus-login",
  component: () => (
    <LazyPage>
      <CampusLoginPage />
    </LazyPage>
  ),
});

const foodMapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tools/food-map",
  component: () => (
    <LazyPage>
      <FoodMapPage />
    </LazyPage>
  ),
});

const joinUsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pages/joinus",
  component: () => (
    <LazyPage>
      <JoinUsPage />
    </LazyPage>
  ),
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pages/privacy",
  component: () => (
    <LazyPage>
      <PrivacyPage />
    </LazyPage>
  ),
});

const privacyHtmlRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pages/pp",
  component: () => (
    <LazyPage>
      <PrivacyPage />
    </LazyPage>
  ),
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pages/terms",
  component: () => (
    <LazyPage>
      <TermsPage />
    </LazyPage>
  ),
});

const termsHtmlRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pages/tos",
  component: () => (
    <LazyPage>
      <TermsPage />
    </LazyPage>
  ),
});

const updatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pages/update",
  component: () => (
    <LazyPage>
      <UpdatesPage />
    </LazyPage>
  ),
});

const commentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pages/comment",
  component: () => (
    <LazyPage>
      <CommentsPage />
    </LazyPage>
  ),
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/404",
  component: () => (
    <LazyPage>
      <NotFoundPage />
    </LazyPage>
  ),
});

const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    classRecommendRoute,
    locationSimulationTutorialRoute,
    leaveSlipRoute,
    newsRoute,
    campusLoginRoute,
    foodMapRoute,
    joinUsRoute,
    privacyRoute,
    privacyHtmlRoute,
    termsRoute,
    termsHtmlRoute,
    updatesRoute,
    commentsRoute,
    notFoundRoute,
  ]),
});

const root = document.querySelector("#root");

if (!root) {
  throw new Error("root element missing");
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
