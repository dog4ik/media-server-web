import { NotificationProps } from "@/components/Notification";
import { useRawNotifications } from "@/context/NotificationContext";
import { formatSE } from "./formats";
import { fullUrl, Schemas, server } from "./serverApi";
import { createAsync } from "@solidjs/router";
import { throwResponseErrors } from "./errors";
import { isCompatible } from "./mediaCapabilities/mediaCapabilities";

export function defaultTrack<T extends { is_default: boolean }>(tracks: T[]) {
  return tracks.find((t) => t.is_default) ?? tracks.at(0);
}

async function externalToLocal<T extends Media>(content: T) {
  return await server
    .GET("/api/external_to_local/{id}", {
      params: {
        query: { provider: content.metadata_provider },
        path: { id: content.metadata_id },
      },
    })
    .then((res) => res.data);
}

export function posterList(media: Media) {
  let list: string[] = [];
  let localPoster = media.localPoster();
  if (localPoster) {
    list.push(localPoster);
  }
  if (media.poster) {
    list.push(media.poster);
  }
  return list;
}

export interface Media {
  metadata_id: string;
  metadata_provider: Schemas["MetadataProvider"];
  poster?: string;
  url(): string;
  localPoster(): string;
  friendlyTitle(): string;
  delete(): Promise<Schemas["AppError"] | undefined>;
}

export type ExtendedMovie = Schemas["MovieMetadata"] &
  Media & {
    localId(): Promise<number | undefined>;
    fetchVideos(): Promise<Video[] | undefined>;
  };

export async function fetchMovie(
  movieId: string,
  metadataProvider?: Schemas["MetadataProvider"],
) {
  let movieMetadata = await server
    .GET("/api/movie/{id}", {
      params: {
        path: { id: movieId },
        query: { provider: metadataProvider ?? "local" },
      },
    })
    .then(throwResponseErrors);
  return extendMovie(movieMetadata);
}

/// We are doing things this way because stupid classes can't spread in constructor
export function extendMovie(movie: Schemas["MovieMetadata"]): ExtendedMovie {
  return {
    ...movie,

    async delete() {
      if (this.metadata_provider != "local") return;
      return await server
        .DELETE("/api/local_movie/{id}", {
          params: { path: { id: +this.metadata_id } },
        })
        .then((r) => r.error);
    },

    localPoster() {
      return fullUrl("/api/movie/{id}/poster", {
        path: { id: +this.metadata_id },
      });
    },

    url() {
      return `/movies/${this.metadata_id}?provider=${this.metadata_provider}`;
    },

    friendlyTitle() {
      return this.title;
    },

    async fetchVideos() {
      if (this.metadata_provider == "local") {
        let metadata = await server
          .GET("/api/video/by_content", {
            params: { query: { content_type: "movie", id: +this.metadata_id } },
          })
          .then((res) =>
            res.data ? res.data.map((v) => new Video(v)) : undefined,
          );
        return metadata;
      }
    },

    async localId() {
      if (this.metadata_provider !== "local")
        return await externalToLocal(this).then(
          (r) => r?.movie_id ?? undefined,
        );
      else return +this.metadata_id;
    },
    poster: movie.poster ?? undefined,
  };
}

export type ExtendedShow = Schemas["ShowMetadata"] &
  Media & { localId(): Promise<number | undefined> };

export async function fetchShow(
  showId: string,
  metadataProvider?: Schemas["MetadataProvider"],
) {
  let showMetadata = await server
    .GET("/api/show/{id}", {
      params: {
        path: { id: showId },
        query: { provider: metadataProvider ?? "local" },
      },
    })
    .then(throwResponseErrors);
  return extendShow(showMetadata);
}

/// We are doing things this way because stupid classes can't spread in constructor
export function extendShow(show: Schemas["ShowMetadata"]): ExtendedShow {
  return {
    ...show,

    async delete() {
      if (this.metadata_provider != "local") return;
      return await server
        .DELETE("/api/local_show/{id}", {
          params: { path: { id: +this.metadata_id } },
        })
        .then((r) => r.error);
    },

    localPoster() {
      return fullUrl("/api/show/{id}/poster", {
        path: { id: +this.metadata_id },
      });
    },

    url() {
      return `/shows/${this.metadata_id}?provider=${this.metadata_provider}`;
    },

    friendlyTitle(): string {
      return this.title;
    },

    async localId() {
      return this.metadata_provider !== "local"
        ? await externalToLocal(this).then((r) => r?.show_id ?? undefined)
        : +this.metadata_id;
    },
    poster: show.poster ?? undefined,
  };
}

export type ExtendedSeason = Schemas["SeasonMetadata"] &
  Media & {
    fetchEpisode(
      number: number,
    ): Promise<Schemas["EpisodeMetadata"] | undefined>;
    extended_episodes: ExtendedEpisode[];
  };

export async function fetchSeason(
  showId: string,
  seasonNumber: number,
  metadataProvider?: Schemas["MetadataProvider"],
) {
  let seasonMetadata = await server
    .GET("/api/show/{id}/{season}", {
      params: {
        path: { id: showId, season: seasonNumber },
        query: { provider: metadataProvider ?? "local" },
      },
    })
    .then((res) => res.data);
  if (seasonMetadata) {
    return extendSeason(seasonMetadata, showId);
  }
}

/// We are doing things this way because stupid classes can't spread in constructor
export function extendSeason(
  season: Schemas["SeasonMetadata"],
  showId: string,
): ExtendedSeason {
  return {
    ...season,
    extended_episodes: season.episodes.map((episode) =>
      extendEpisode(episode, showId),
    ),

    async delete() {
      if (this.metadata_provider != "local") return;
      return await server
        .DELETE("/api/local_season/{id}", {
          params: { path: { id: +this.metadata_id } },
        })
        .then((r) => r.error);
    },

    async fetchEpisode(number: number) {
      return await fetchEpisode(
        showId,
        season.number,
        number,
        this.metadata_provider,
      );
    },

    localPoster() {
      return fullUrl("/api/season/{id}/poster", {
        path: { id: +this.metadata_id },
      });
    },

    url() {
      return `/shows/${this.metadata_id}/?season=${this.number}&provider=${this.metadata_provider}`;
    },

    friendlyTitle(): string {
      return `Season ${this.number}`;
    },
    poster: season.poster ?? undefined,
  };
}

export type ExtendedEpisode = Schemas["EpisodeMetadata"] &
  Media & {
    fetchVideos(): Promise<Video[] | undefined>;
    /**
     * Show aware notificator
     */
    showNotifications(
      notificator: ReturnType<typeof useRawNotifications>,
      showTitle: string,
      poster?: string,
    ): (msg: string) => void;
  };

export async function fetchEpisode(
  showId: string,
  seasonNumber: number,
  episodeNumber: number,
  metadataProvider?: Schemas["MetadataProvider"],
) {
  let episodeMetadata = await server
    .GET("/api/show/{id}/{season}/{episode}", {
      params: {
        path: { id: showId, season: seasonNumber, episode: episodeNumber },
        query: { provider: metadataProvider ?? "local" },
      },
    })
    .then(throwResponseErrors);
  return extendEpisode(episodeMetadata, showId);
}

/// We are doing things this way because stupid classes can't spread in constructor
export function extendEpisode(
  episode: Schemas["EpisodeMetadata"],
  showId: string,
): ExtendedEpisode {
  return {
    ...episode,

    async delete() {
      if (this.metadata_provider != "local") return;
      return await server
        .DELETE("/api/local_episode/{id}", {
          params: { path: { id: +this.metadata_id } },
        })
        .then((r) => r.error);
    },

    localPoster() {
      return fullUrl("/api/episode/{id}/poster", {
        path: { id: +this.metadata_id },
      });
    },

    url() {
      return `/shows/${showId}/${this.season_number}/${this.number}?provider=${this.metadata_provider}`;
    },

    friendlyTitle(): string {
      return `${this.title} S${formatSE(this.season_number)}E${formatSE(this.number)}`;
    },

    async fetchVideos() {
      if (this.metadata_provider == "local") {
        let metadata = await server
          .GET("/api/video/by_content", {
            params: { query: { content_type: "show", id: +this.metadata_id } },
          })
          .then((res) =>
            res.data ? res.data.map((v) => new Video(v)) : undefined,
          );
        return metadata;
      }
    },

    showNotifications(notificator, showTitle, poster) {
      let props = {
        poster,
        subTitle: `${showTitle} S${formatSE(this.season_number)}E${formatSE(this.number)}`,
        message: "",
        contentUrl: this.url(),
      };
      return (message: string) => {
        props.message = message;
        notificator(props);
      };
    },

    poster: episode.poster ?? undefined,
  };
}

export type ExtendedVideoContent = Schemas["VideoContentMetadata"] &
  Media & {
    content: ExtendedMovie | ExtendedShow;
  };

export async function fetchVideoContent(videoId: number) {
  let episodeMetadata = await server
    .GET("/api/video/{id}/metadata", {
      params: {
        path: { id: videoId },
      },
    })
    .then((res) => res.data);
  if (episodeMetadata) {
    return extendVideoContent(episodeMetadata);
  }
}

/// We are doing things this way because stupid classes can't spread in constructor
export function extendVideoContent(
  content: Schemas["VideoContentMetadata"],
): ExtendedVideoContent {
  return {
    ...content,
    content:
      content.content_type == "movie"
        ? extendMovie(content.movie)
        : extendShow(content.show),
    metadata_id:
      content.content_type == "movie"
        ? content.movie.metadata_id
        : content.show.metadata_id,
    metadata_provider:
      content.content_type == "movie"
        ? content.movie.metadata_provider
        : content.show.metadata_provider,
    url(): string {
      return this.content.url();
    },

    async delete() {
      return await this.content.delete();
    },

    localPoster(): string {
      return this.content.localPoster();
    },

    friendlyTitle() {
      if (content.content_type == "movie") {
        return this.content.friendlyTitle();
      } else {
        let showMetadata = content.show;
        let episodeMetadata = content.episode;
        return `${showMetadata.title} S${formatSE(episodeMetadata.season_number)}E${formatSE(episodeMetadata.number)}`;
      }
    },
  };
}

export class Content<T extends Media> {
  constructor(public inner: T) {}
  posterList() {
    let list: string[] = [];
    let localPoster = this.inner.localPoster();
    if (localPoster) {
      list.push(localPoster);
    }
    if (this.inner.poster) {
      list.push(this.inner.poster);
    }
    return list;
  }

  notificationProps(message: string): NotificationProps {
    return {
      poster: this.posterList().at(0),
      subTitle: this.inner.friendlyTitle(),
      message,
      contentUrl: this.inner.url(),
    };
  }

  isLocal() {
    return this.inner.metadata_provider == "local";
  }

  url() {
    return this.inner.url();
  }

  notificate(notificator: ReturnType<typeof useRawNotifications>) {
    return (message: string) => {
      let props = this.notificationProps(message);
      notificator(props);
    };
  }
}

export class Video {
  constructor(public details: Schemas["DetailedVideo"]) {}

  /**
   Create solidjs async signal
   */
  static createAsync(videoId: number) {
    return createAsync(async () => await Video.fetch(videoId));
  }

  static async fetch(videoId: number) {
    let video = await server
      .GET("/api/video/{id}", {
        params: { path: { id: videoId } },
      })
      .then((res) => res.data);
    if (video) {
      return new Video(video);
    }
  }

  async refetch() {
    let newVideo = await Video.fetch(this.details.id);
    if (newVideo) {
      this.details = newVideo.details;
    }
  }

  private params() {
    return { path: { id: this.details.id } };
  }

  async transcode(payload: Schemas["TranscodePayload"]) {
    await server.POST("/api/video/{id}/transcode", {
      params: this.params(),
      body: payload,
    });
  }

  async generatePreviews() {
    if (this.details.previews_count === 0) {
      await server.POST("/api/video/{id}/previews", {
        params: this.params(),
      });
    }
  }

  async deletePreviews() {
    if (this.details.previews_count !== 0) {
      await server.DELETE("/api/video/{id}/previews", {
        params: this.params(),
      });
    }
  }

  async startLiveTranscode() {
    return await server
      .POST("/api/video/{id}/stream_transcode", {
        params: this.params(),
      })
      .then((r) => r.data?.id);
  }

  defaultSubtitles() {
    return this.details.subtitle_tracks.find((t) => t.is_default);
  }

  defaultAudio() {
    return defaultTrack(this.details.audio_tracks);
  }

  defaultVideo() {
    return defaultTrack(this.details.video_tracks);
  }

  videoCompatibility() {
    return createAsync(async () => {
      return await isCompatible(this.defaultVideo(), this.defaultAudio());
    });
  }

  fetchMetadata() {
    return server.GET("/api/video/{id}/metadata", {
      params: { path: { id: this.details.id } },
    });
  }

  variants() {
    return this.details.variants.map((v) => new VariantVideo(v));
  }
}

export class VariantVideo {
  constructor(public details: Schemas["DetailedVariant"]) {}

  defaultAudio() {
    return defaultTrack(this.details.audio_tracks);
  }

  defaultVideo() {
    return defaultTrack(this.details.video_tracks);
  }

  defaultSubtitles() {
    return undefined;
  }

  videoCompatibility() {
    return createAsync(async () => {
      return await isCompatible(this.defaultVideo(), this.defaultAudio());
    });
  }
}
