import type { TimelineRepository } from "@/lib/repositories/types";

export const localTimelineRepository: TimelineRepository = {
  listInitial() {
    return [];
  },
};
