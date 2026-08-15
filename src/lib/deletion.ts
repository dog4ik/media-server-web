import { queryApi } from "@/utils/queryApi";

/** Deleting an episode can also remove its season or the whole show */
export function invalidateEpisodeDeleteQueries() {
  queryApi.invalidateQueries("get", "/api/show/{id}/{season}");
  queryApi.invalidateQueries("get", "/api/show/{id}");
  queryApi.invalidateQueries("get", "/api/local_shows");
  queryApi.invalidateQueries("get", "/api/history/suggest/shows");
  queryApi.invalidateQueries("get", "/api/history");
}

type DeleteEpisodeOptions = {
  onDeleted?: () => void;
};

export function useDeleteEpisode(opts?: DeleteEpisodeOptions) {
  return queryApi.useMutation("delete", "/api/local_episode/{id}", () => ({
    onSuccess: () => opts?.onDeleted?.(),
    onSettled: invalidateEpisodeDeleteQueries,
  }));
}
