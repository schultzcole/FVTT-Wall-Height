import { Token_onUpdate, SightLayer_updateToken, SightLayer_computeSight, WallsLayer_getWallCollisionsForRay } from "./patches.js";
import { MODULE_SCOPE, TOP_KEY, BOTTOM_KEY } from "./const.js";
import { getWallBounds } from "./utils.js";

Hooks.on("init", () => {
    Token_onUpdate();
    SightLayer_updateToken();
    SightLayer_computeSight();
    WallsLayer_getWallCollisionsForRay();
});

Hooks.on("renderWallConfig", (app, html, data) => {
    const { wallHeightTop, wallHeightBottom } = getWallBounds(app.object);
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
