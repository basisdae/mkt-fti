import type { PipelineLogRepository } from "@/lib/repositories/types";

export const localPipelineLogRepository: PipelineLogRepository = {
  listInitial() {
    return [];
  },
};
