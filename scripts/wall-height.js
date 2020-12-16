import { Patch_Token_onUpdate, Patch_WallCollisions } from "./patches.js";
import { MODULE_SCOPE, TOP_KEY, BOTTOM_KEY } from "./const.js";
import { getWallBounds } from "./utils.js";

Hooks.on("init", () => {
    Patch_Token_onUpdate();
    Patch_WallCollisions();
});

Hooks.on("renderWallConfig", (app, html, data) => {
    const { wallHeightTop, wallHeightBottom } = getWallBounds(app.object);
    const topLabel = game.i18n.localize(`${MODULE_SCOPE}.WallHeightTopLabel`);
    const bottomLabel = game.i18n.localize(`${MODULE_SCOPE}.WallHeightBottomLabel`);
    html.find(".form-group").last().after(`
        <div class="form-group">
            <label>${topLabel}</label>
            <input name="flags.${MODULE_SCOPE}.${TOP_KEY}" type="text" data-dtype="Number" value="${wallHeightTop}">
        </div>
        <div class="form-group">
            <label>${bottomLabel}</label>
            <input name="flags.${MODULE_SCOPE}.${BOTTOM_KEY}" type="text" data-dtype="Number" value="${wallHeightBottom}">
        </div>
    `);
    app.setPosition({ height: "auto" });
});
