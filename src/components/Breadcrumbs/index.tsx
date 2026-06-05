import { Component, For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Link, useRouterState, type LinkOptions } from "@tanstack/solid-router";
import {
  Breadcrumbs,
  BreadcrumbList,
  BreadcrumbsItem,
  BreadcrumbsLink,
  BreadcrumbsSeparator,
} from "@/ui/breadcrumbs";
import { queryApi } from "@/utils/queryApi";
import { extendEpisode, extendMovie, extendShow } from "@/utils/library";
import type { Schemas } from "@/utils/serverApi";

type Provider = Schemas["MetadataProvider"];

export type Crumb = {
  label: string | Component;
  link: LinkOptions;
};

function CrumbLabel(props: { label: string | Component }) {
  return (
    <Show when={typeof props.label !== "string"} fallback={<>{props.label as string}</>}>
      <Dynamic component={props.label as Component} />
    </Show>
  );
}

export function AppBreadcrumbs() {
  let matches = useRouterState({ select: (s) => s.matches });

  let crumbs = (): Crumb[] => {
    let withCrumbs = matches().filter((match) => match.context.crumbs !== undefined);
    return withCrumbs.at(-1)?.context.crumbs ?? [];
  };

  return (
    <Show when={crumbs().length > 0}>
      <Breadcrumbs>
        <BreadcrumbList>
          <For each={crumbs()}>
            {(crumb, i) => {
              let isLast = () => i() === crumbs().length - 1;
              return (
                <>
                  <BreadcrumbsItem>
                    <Show
                      when={!isLast()}
                      fallback={
                        <BreadcrumbsLink current>
                          <CrumbLabel label={crumb.label} />
                        </BreadcrumbsLink>
                      }
                    >
                      <BreadcrumbsLink as={Link} {...(crumb.link as object)}>
                        <CrumbLabel label={crumb.label} />
                      </BreadcrumbsLink>
                    </Show>
                  </BreadcrumbsItem>
                  <Show when={!isLast()}>
                    <BreadcrumbsSeparator />
                  </Show>
                </>
              );
            }}
          </For>
        </BreadcrumbList>
      </Breadcrumbs>
    </Show>
  );
}

export function MovieTitleCrumb(props: { id: string; provider: Provider }) {
  let movie = queryApi.useQuery(
    "get",
    "/api/movie/{id}",
    () => ({
      params: { query: { provider: props.provider }, path: { id: props.id } },
    }),
    () => ({ select: extendMovie }),
  );
  return <>{movie.data?.title ?? "Movie"}</>;
}

export function ShowTitleCrumb(props: { id: string; provider: Provider }) {
  let show = queryApi.useQuery(
    "get",
    "/api/show/{id}",
    () => ({
      params: { query: { provider: props.provider }, path: { id: props.id } },
    }),
    () => ({ select: extendShow }),
  );
  return <>{show.data?.title ?? "Show"}</>;
}

export function EpisodeTitleCrumb(props: {
  id: string;
  season: number;
  episode: number;
  provider: Provider;
}) {
  let episode = queryApi.useQuery(
    "get",
    "/api/show/{id}/{season}/{episode}",
    () => ({
      params: {
        path: { id: props.id, season: props.season, episode: props.episode },
        query: { provider: props.provider },
      },
    }),
    () => ({ select: (episode) => extendEpisode(episode, props.id) }),
  );
  return <>{episode.data?.title ?? `Episode ${props.episode}`}</>;
}
