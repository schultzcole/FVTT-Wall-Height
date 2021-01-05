import { MODULE_SCOPE, TOP_KEY, BOTTOM_KEY } from "./const.js";
import { getWallBounds } from "./utils.js";

export function Patch_Token_onUpdate() {
    const oldOnUpdate = Token.prototype._onUpdate;
    Token.prototype._onUpdate = function (data, options) {
        oldOnUpdate.apply(this, arguments);

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
}

export function Patch_WallCollisions() {
    // store the token elevation in a common scope, so that it can be used by the following functions without needing to pass it explicitly
    let currentTokenElevation = null;

    const oldTokenUpdateSource = Token.prototype.updateSource;
    Token.prototype.updateSource = function () {
        currentTokenElevation = this.data.elevation;
        oldTokenUpdateSource.apply(this, arguments);
        currentTokenElevation = null;
    };

    const oldWallsLayerTestWall = WallsLayer.testWall;
    WallsLayer.testWall = function (ray, wall) {
        const { wallHeightTop, wallHeightBottom } = getWallBounds(wall);
        if (
            currentTokenElevation == null ||
            (currentTokenElevation >= wallHeightBottom && currentTokenElevation < wallHeightTop)
        ) {
            return oldWallsLayerTestWall.apply(this, arguments);
        } else {
            return null;
        }
    };

    const oldcheckCollision = WallsLayer.checkCollision;
    WallsLayer.checkCollision = function (ray) {
        const result = oldcheckCollision(ray);
        if(result){
            currentTokenElevation = this.data.elevation;
            const collisionArray = WallsLayer.getRayCollisions(ray,true,false,"all",null);
            collisionArray.forEach(function(element){
               const {wallHeightTop, wallHeightBottom} = getWallBounds(element.Wall);
               if (currentTokenElevation == null || (currentTokenElevation >= wallHeightBottom && currentTokenElevation < wallHeightTop)) {
                   return true;
               }
            });
            

        }
        return null;
    }
}
