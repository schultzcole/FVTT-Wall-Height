import { Token_onUpdate, SightLayer_updateToken, SightLayer_computeSight, WallsLayer_getWallCollisionsForRay } from "./patches.js";
import { MODULE_SCOPE, TOP_KEY, BOTTOM_KEY } from "./const.js";

Hooks.on("init", () => {
    Token_onUpdate();
    SightLayer_updateToken();
    SightLayer_computeSight();
    WallsLayer_getWallCollisionsForRay();
});

Hooks.on("renderWallConfig", (app, html, data) => {
    let wallHeightTop = app.object.getFlag(MODULE_SCOPE, TOP_KEY);
    if (wallHeightTop === null || wallHeightTop === undefined) wallHeightTop = Infinity;
    let wallHeightBottom = app.object.getFlag(MODULE_SCOPE, BOTTOM_KEY);
    if (wallHeightBottom === null || wallHeightBottom === undefined) wallHeightBottom = -Infinity;
    html.height("325px");
    html.find("form button").before(`
        <div class="form-group">
            <label>Wall Height (Top)</label>
            <input name="flags.${MODULE_SCOPE}.${TOP_KEY}" type="text" data-dtype="Number" value="${wallHeightTop}">
        </div>
        <div class="form-group">
            <label>Wall Height (Bottom)</label>
            <input name="flags.${MODULE_SCOPE}.${BOTTOM_KEY}" type="text" data-dtype="Number" value="${wallHeightBottom}">
        </div>
    `);
});
