import type {
  AddRomsResponse,
  MessageResponse,
  SearchCoverSchema,
  SearchRomSchema,
} from "@/__generated__";
import api from "@/services/api/index";
import socket from "@/services/socket";
import storeDownload from "@/stores/download";
import type { SimpleRom, DetailedRom } from "@/stores/roms";
import { getDownloadLink } from "@/utils";

export const romApi = api;

async function uploadRoms({
  platformId,
  romsToUpload,
}: {
  platformId: number;
  romsToUpload: File[];
}): Promise<{ data: AddRomsResponse }> {
  const formData = new FormData();
  romsToUpload.forEach((rom) => formData.append("roms", rom));

  return api.post("/roms", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    params: { platform_id: platformId },
  });
}

async function getRoms({
  platformId = null,
  searchTerm = "",
  orderBy = "name",
  orderDir = "asc",
}: {
  platformId?: number | null;
  searchTerm?: string | null;
  orderBy?: string | null;
  orderDir?: string | null;
}): Promise<{ data: SimpleRom[] }> {
  return api.get(`/roms`, {
    params: {
      platform_id: platformId,
      search_term: searchTerm,
      order_by: orderBy,
      order_dir: orderDir,
    },
  });
}

async function getRecentRoms(): Promise<{ data: SimpleRom[] }> {
  return api.get("/roms", {
    params: { order_by: "id", order_dir: "desc", limit: 15 },
  });
}

async function getRom({
  romId,
}: {
  romId: number;
}): Promise<{ data: DetailedRom }> {
  return api.get(`/roms/${romId}`);
}

function clearRomFromDownloads({ id }: { id: number }) {
  const downloadStore = storeDownload();
  downloadStore.remove(id);

  // Disconnect socket when no more downloads are in progress
  if (downloadStore.value.length === 0) socket.disconnect();
}

async function searchRom({
  romId,
  searchTerm,
  searchBy,
}: {
  romId: number;
  searchTerm: string;
  searchBy: string;
}): Promise<{ data: SearchRomSchema[] }> {
  return api.get("/search/roms", {
    params: {
      rom_id: romId,
      search_term: searchTerm,
      search_by: searchBy,
    },
  });
}

async function searchCover({
  searchTerm,
}: {
  searchTerm: string;
}): Promise<{ data: SearchCoverSchema[] }> {
  return api.get("/search/cover", { params: { search_term: searchTerm } });
}

// Listen for multi-file download completion events
socket.on("download:complete", clearRomFromDownloads);

// Used only for multi-file downloads
async function downloadRom({
  rom,
  files = [],
}: {
  rom: SimpleRom;
  files?: string[];
}) {
  const a = document.createElement("a");
  a.href = getDownloadLink({ rom, files });
  a.click();

  // Only connect socket if multi-file download
  if (rom.multi && files.length > 1) {
    if (!socket.connected) socket.connect();
    storeDownload().add(rom.id);

    // Clear download state after 60 seconds in case error/timeout
    setTimeout(() => {
      clearRomFromDownloads(rom);
    }, 60 * 1000);
  }
}

export type UpdateRom = SimpleRom & {
  artwork?: File;
};

async function updateRom({
  rom,
  renameAsSource = false,
  removeCover = false,
}: {
  rom: UpdateRom;
  renameAsSource?: boolean;
  removeCover?: boolean;
}): Promise<{ data: DetailedRom }> {
  const formData = new FormData();
  if (rom.igdb_id) formData.append("igdb_id", rom.igdb_id.toString());
  if (rom.moby_id) formData.append("moby_id", rom.moby_id.toString());
  // if (rom.fav_sibling)
  //   formData.append("fav_sibling", rom.fav_sibling.toString());
  formData.append("name", rom.name || "");
  formData.append("file_name", rom.file_name);
  formData.append("summary", rom.summary || "");
  formData.append("url_cover", rom.url_cover || "");
  if (rom.artwork) formData.append("artwork", rom.artwork);

  return api.put(`/roms/${rom.id}`, formData, {
    params: { rename_as_source: renameAsSource, remove_cover: removeCover },
  });
}

async function deleteRoms({
  roms,
  deleteFromFs = [],
}: {
  roms: SimpleRom[];
  deleteFromFs: number[];
}): Promise<{ data: MessageResponse }> {
  return api.post("/roms/delete", {
    roms: roms.map((r) => r.id),
    delete_from_fs: deleteFromFs,
  });
}

async function updateUserRomProps({
  romId,
  noteRawMarkdown,
  noteIsPublic,
}: {
  romId: number;
  noteRawMarkdown: string;
  noteIsPublic: boolean;
}): Promise<{ data: DetailedRom }> {
  return api.put(`/roms/${romId}/props`, {
    note_raw_markdown: noteRawMarkdown,
    note_is_public: noteIsPublic,
  });
}

export default {
  uploadRoms,
  getRoms,
  getRecentRoms,
  getRom,
  downloadRom,
  searchRom,
  searchCover,
  updateRom,
  deleteRoms,
  updateUserRomProps,
};
