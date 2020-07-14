import { Patch_Token_onUpdate, Patch_SightLayer_updateToken, Patch_SightLayer_computeSight, Patch_WallsLayer_getWallCollisionsForRay } from "./patches.js";
import { PF1Patch_SightLayer_updateToken, PF1Patch_Token_getDarkvisionSight } from "./pf1-patches.js";
import { MODULE_SCOPE, TOP_KEY, BOTTOM_KEY } from "./const.js";
import { getWallBounds } from "./utils.js";

Hooks.on("init", () => {
    Patch_Token_onUpdate();
    Patch_SightLayer_computeSight();
    Patch_WallsLayer_getWallCollisionsForRay();

    const systemId = game.data.system.id;
    switch (systemId) {
        case "D35E":
        case "pf1":
            PF1Patch_SightLayer_updateToken();
            PF1Patch_Token_getDarkvisionSight();
            break;
        default:
            Patch_SightLayer_updateToken();
    }
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
