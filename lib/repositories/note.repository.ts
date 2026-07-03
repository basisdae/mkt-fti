import type { NoteRepository } from "@/lib/repositories/types";

export const localNoteRepository: NoteRepository = {
  listInitial() {
    return [];
  },
};
