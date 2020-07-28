import { MODULE_SCOPE, TOP_KEY, BOTTOM_KEY } from "./const.js";
import { getWallBounds } from "./utils.js";

export function Patch_Token_onUpdate() {
    const oldOnUpdate = Token.prototype._onUpdate;
    Token.prototype._onUpdate = function (data, options) {
        oldOnUpdate.call(this, data, options);

        const changed = new Set(Object.keys(data));

        // if the original _onUpdate didn't perform a sight layer update,
        // but elevation has changed, do the update now
        const visibilityChange = changed.has("hidden");
        const positionChange = ["x", "y"].some((c) => changed.has(c));
        const perspectiveChange = changed.has("rotation") && this.hasLimitedVisionAngle;
        const visionChange = [
            "brightLight",
            "brightSight",
            "dimLight",
            "dimSight",
            "lightAlpha",
            "lightAngle",
            "lightColor",
            "sightAngle",
            "vision",
        ].some((k) => changed.has(k));
        const alreadyUpdated =
            (visibilityChange || positionChange || perspectiveChange || visionChange) &&
            (this.data.vision || changed.has("vision") || this.emitsLight);
        if (changed.has("elevation") && !alreadyUpdated) {
            canvas.sight.updateToken(this, { defer: true });
            canvas.addPendingOperation("SightLayer.update", canvas.sight.update, canvas.sight);
            canvas.addPendingOperation("LightingLayer.update", canvas.lighting.update, canvas.lighting);
            canvas.addPendingOperation(`SoundLayer.update`, canvas.sounds.update, canvas.sounds);
        }
    };
}

export function Patch_WallCollisions() {
    // store the token elevation in a common scope, so that it can be used by the following functions without needing to pass it explicitly
    let currentTokenElevation = null;

    const oldSightLayerUpdateToken = SightLayer.prototype.updateToken;
    SightLayer.prototype.updateToken = function (
        token,
        { defer = false, deleted = false, walls = null, forceUpdateFog = false } = {}
    ) {
        currentTokenElevation = token.data.elevation;
        oldSightLayerUpdateToken.call(this, token, { defer, deleted, walls, forceUpdateFog });
        currentTokenElevation = null;
    };

    if (["D35E", "pf1e"].includes(game.data.system.id)) {
        const oldGetDarkVisionSight = Token.prototype.getDarkvisionSight;
        Token.prototype.getDarkvisionSight = function () {
            currentTokenElevation = this.data.elevation;
            const result = oldGetDarkVisionSight.call(this);
            currentTokenElevation = null;
            return result;
        };
    }

    const oldGetWallCollisionsForRay = WallsLayer.getWallCollisionsForRay;
    WallsLayer.getWallCollisionsForRay = function (ray, walls, { mode = "all" } = {}) {
        let filteredWalls = walls;
        if (currentTokenElevation != null) {
            filteredWalls = walls.filter((w) => {
                const { wallHeightTop, wallHeightBottom } = getWallBounds(w);
                return currentTokenElevation >= wallHeightBottom && currentTokenElevation < wallHeightTop;
            });
        }
        return oldGetWallCollisionsForRay.call(this, ray, filteredWalls, { mode });
    };
}
