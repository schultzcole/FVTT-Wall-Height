import { MODULE_SCOPE, TOP_KEY, BOTTOM_KEY } from "./const.js";
import { getWallBounds } from "./utils.js";

export function Patch_Token_onUpdate() {
    const onUpdate = function (wrapped, ...args) {
        const [ data, options ] = args;

        wrapped(...args);

        const changed = new Set(Object.keys(data));

        // existing conditions that have already been checked to perform a sight layer update
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

        // if the original _onUpdate didn't perform a sight layer update,
        // but elevation has changed, do the update now
        if (changed.has("elevation") && !alreadyUpdated) {
            canvas.sight.updateToken(this, { defer: true });
            canvas.addPendingOperation("SightLayer.update", canvas.sight.update, canvas.sight);
            canvas.addPendingOperation("LightingLayer.update", canvas.lighting.update, canvas.lighting);
            canvas.addPendingOperation(`SoundLayer.update`, canvas.sounds.update, canvas.sounds);
        }
    };

    if (game.modules.get("lib-wrapper")?.active) {
        libWrapper.register("wall-height", "Token.prototype._onUpdate", onUpdate, "WRAPPER");
    } else {
        const oldOnUpdate = Token.prototype._onUpdate;
        Token.prototype._onUpdate = function () {
            return onUpdate.call(this, oldOnUpdate.bind(this), ...arguments);
        }
    }
}

export function Patch_WallCollisions() {
    // store the token elevation in a common scope, so that it can be used by the following functions without needing to pass it explicitly
    let currentTokenElevation = null;

    const updateSource = function (wrapped, ...args) {
        currentTokenElevation = this.data.elevation;
        wrapped(...args);
        currentTokenElevation = null;
    };

    const testWall = function (wrapped, ...args) {
        const [ ray, wall ] = args;
        const { wallHeightTop, wallHeightBottom } = getWallBounds(wall);
        if (
            currentTokenElevation == null ||
            (currentTokenElevation >= wallHeightBottom && currentTokenElevation < wallHeightTop)
        ) {
            return wrapped(...args);
        } else {
            return null;
        }
    };

    if (game.modules.get("lib-wrapper")?.active) {
        libWrapper.register("wall-height", "Token.prototype.updateSource", updateSource, "WRAPPER");
        libWrapper.register("wall-height", "WallsLayer.testWall", testWall, "MIXED");
    } else {
        const oldTokenUpdateSource = Token.prototype.updateSource;
        Token.prototype.updateSource = function () {
            return updateSource.call(this, oldTokenUpdateSource.bind(this), ...arguments);
        }

        const oldWallsLayerTestWall = WallsLayer.testWall;
        WallsLayer.testWall = function () {
            return testWall.call(this, oldWallsLayerTestWall.bind(this), ...arguments);
        }
    }
}
