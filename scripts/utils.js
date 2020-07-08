import { MODULE_SCOPE, TOP_KEY, BOTTOM_KEY } from "./const.js";

export function getWallBounds(wall) {
    let wallHeightTop = wall.data.flags?.wallHeight?.wallHeightTop;
    if (wallHeightTop === null || wallHeightTop === undefined) wallHeightTop = Infinity;
    let wallHeightBottom = wall.data.flags?.wallHeight?.wallHeightBottom;
    if (wallHeightBottom === null || wallHeightBottom === undefined) wallHeightBottom = -Infinity;

    return { wallHeightTop, wallHeightBottom }
}