from fastapi import APIRouter, Request
import emoji

from logger.logger import log
from handler import igdbh

router = APIRouter()


@router.put("/search/roms/igdb", status_code=200)
async def search_rom_igdb(
    req: Request, search_term: str = "", search_by: str = ""
) -> dict:
    """Get all the roms matched from igdb."""

    data: dict = await req.json()
    rom: dict = data["rom"]
    log.info(emoji.emojize(":magnifying_glass_tilted_right: IGDB Searching"))
    matched_roms: list = []

    log.info(f"Searching by {search_by}: {search_term}")
    if search_by.lower() == "id":
        matched_roms = igdbh.get_matched_roms_by_id(int(search_term))
    elif search_by.lower() == "name":
        matched_roms = (
            []
            if not rom["p_igdb_id"]
            else igdbh.get_matched_roms_by_name(search_term, rom["p_igdb_id"])
        )

    log.info("Results:")

    [log.info(f"\t - {rom['r_name']}") for rom in matched_roms]

    return {"roms": matched_roms, "msg": "success"}
