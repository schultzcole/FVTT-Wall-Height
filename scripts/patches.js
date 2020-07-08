import { MODULE_SCOPE, TOP_KEY, BOTTOM_KEY } from "./const.js";
import { getWallBounds } from "./utils.js";

export function Token_onUpdate() {
    Token.prototype._onUpdate = function(data, options) {
        // Copied from Token#_onUpdate. Foundry version 0.6.4, foundry.js:38152

        const keys = Object.keys(data);
        const changed = new Set(keys);
    
        // If Actor data link has changed, replace the Token actor
        if ( ["actorId", "actorLink"].some(c => changed.has(c))) this.actor = Actor.fromToken(this);
        if ( !this.data.actorLink && changed.has("actorData") ){
          this._onUpdateTokenActor(data.actorData);
        }
    
        // Handle direct Token updates
        const fullRedraw = ["img", "name", "width", "height", "tint"].some(r => changed.has(r));
        const visibilityChange = changed.has("hidden");
        const positionChange = ["x", "y"].some(c => changed.has(c));
        const perspectiveChange = changed.has("rotation") && this.hasLimitedVisionAngle;
        const visionChange = ["brightLight", "brightSight", "dimLight", "dimSight", "lightAlpha", "lightAngle",
          "lightColor", "sightAngle", "vision"].some(k => changed.has(k));
/// CHANGE HERE
        const elevationChange = changed.has("elevation");

    
        // Change in Token appearance
        if ( fullRedraw ) {
          const visible = this.visible;
          this.draw();
          this.visible = visible;
        }
    
        // Non-full updates
        else {
          if ( positionChange ) this.setPosition(this.data.x, this.data.y, options);
          if ( ["effects", "overlayEffect"].some(k => changed.has(k)) ) this.drawEffects();
          if ( changed.has("elevation") ) this.drawTooltip();
          if ( keys.some(k => k.startsWith("bar")) ) this.drawBars();
          this.refresh();
        }
    
        // Changes to Token control eligibility due to visibility changes
        if ( visibilityChange && !game.user.isGM ) {
          if ( this._controlled && data.hidden ) this.release();
          else if ( !data.hidden && !canvas.tokens.controlled.length ) this.control({pan: true});
          this.visible = this.isVisible;
        }
    
        // Process perspective changes
/// CHANGE HERE
        const updatePerspective = (visibilityChange || positionChange || perspectiveChange || visionChange || elevationChange) &&
          (this.data.vision || changed.has("vision") || this.emitsLight);
        if ( updatePerspective ) {
          canvas.sight.updateToken(this, {defer: true});
          canvas.addPendingOperation("SightLayer.update", canvas.sight.update, canvas.sight);
          canvas.addPendingOperation("LightingLayer.update", canvas.lighting.update, canvas.lighting);
          canvas.addPendingOperation(`SoundLayer.update`, canvas.sounds.update, canvas.sounds);
        }
    
        // Process Combat Tracker changes
        if ( this.inCombat ) {
          if ( changed.has("name") ) {
            canvas.addPendingOperation(`Combat.setupTurns`, game.combat.setupTurns, game.combat);
          }
          if ( ["effects", "name"].some(k => changed.has(k)) ) {
            canvas.addPendingOperation(`CombatTracker.render`, ui.combat.render, ui.combat);
          }
        }
      }
}

export function SightLayer_updateToken() {
    SightLayer.prototype.updateToken = function(token, {defer=false, deleted=false, walls=null, forceUpdateFog=false}={}) {
        // Copied from SightLayer#updateToken. Foundry version 0.6.4, foundry.js:32366

        let sourceId = `Token.${token.id}`;
        this.sources.vision.delete(sourceId);
        this.sources.lights.delete(sourceId);
        if ( deleted ) return defer ? null : this.update();
        if ( token.data.hidden && !game.user.isGM ) return;
    
        // Vision is displayed if the token is controlled, or if it is observed by a player with no tokens controlled
        let displayVision = token._controlled;
        if ( !displayVision && !game.user.isGM && !canvas.tokens.controlled.length ) {
          displayVision = token.actor && token.actor.hasPerm(game.user, "OBSERVER");
        }
    
        // Take no action for Tokens which are invisible or Tokens that have no sight or light
        const globalLight = canvas.scene.data.globalLight;
        let isVisionSource = this.tokenVision && token.hasSight && displayVision;
        let isLightSource = token.emitsLight;
    
        // If the Token is no longer a source, we don't need further work
        if ( !isVisionSource && !isLightSource ) return;
    
        // Prepare some common data
        const center = token.getSightOrigin();
        const maxR = globalLight ? Math.max(canvas.dimensions.width, canvas.dimensions.height) : null;
        let [cullMult, cullMin, cullMax] = this._cull;
        if ( globalLight ) cullMin = maxR;
    
        // Prepare vision sources
        if ( isVisionSource ) {
    
          // Compute vision polygons
          let dim = globalLight ? 0 : token.getLightRadius(token.data.dimSight);
          const bright = globalLight ? maxR : token.getLightRadius(token.data.brightSight);
          if ((dim === 0) && (bright === 0)) dim = canvas.dimensions.size * 0.6;
          const radius = Math.max(Math.abs(dim), Math.abs(bright));
          const {los, fov} = this.constructor.computeSight(center, radius, {
            angle: token.data.sightAngle,
            cullMult: cullMult,
            cullMin: cullMin,
            cullMax: cullMax,
            density: 6,
            rotation: token.data.rotation,
            walls: walls,
/// CHANGE HERE
            elevation: token.data.elevation
          });
    
          // Add a vision source
          const source = new SightLayerSource({
            x: center.x,
            y: center.y,
            los: los,
            fov: fov,
            dim: dim,
            bright: bright
          });
          this.sources.vision.set(sourceId, source);
    
          // Update fog exploration for the token position
          this.updateFog(center.x, center.y, Math.max(dim, bright), token.data.sightAngle !== 360, forceUpdateFog);
        }
    
        // Prepare light sources
        if ( isLightSource ) {
    
          // Compute light emission polygons
          const dim = token.getLightRadius(token.data.dimLight);
          const bright = token.getLightRadius(token.data.brightLight);
          const radius = Math.max(Math.abs(dim), Math.abs(bright));
          const {fov} = this.constructor.computeSight(center, radius, {
            angle: token.data.lightAngle,
            cullMult: cullMult,
            cullMin: cullMin,
            cullMax: cullMax,
            density: 6,
            rotation: token.data.rotation,
            walls: walls
          });
    
          // Add a light source
          const source = new SightLayerSource({
            x: center.x,
            y: center.y,
            los: null,
            fov: fov,
            dim: dim,
            bright: bright,
            color: token.data.lightColor,
            alpha: token.data.lightAlpha
          });
          this.sources.lights.set(sourceId, source);
        }
    
        // Maybe update
        if ( CONFIG.debug.sight ) console.debug(`Updated SightLayer source for ${sourceId}`);
        if ( !defer ) this.update();
      }
}

export function SightLayer_computeSight() {
    SightLayer.computeSight = function(origin, radius, {minAngle=null, maxAngle=null, cullMin=10, cullMult=2, cullMax=20,
        density=6, walls, rotation=0, elevation=0, angle=360}={}) {
        // Copied from SightLayer#computeSight. Foundry version 0.6.4, foundry.js:32815
    
        // Get the maximum sight distance and the limiting radius
        let d = canvas.dimensions;
        let {x, y} = origin;
        let distance = Math.max(d.width, d.height);
        let limit = radius / distance;
        let cullDistance = Math.clamped(radius * cullMult, cullMin * d.size, cullMax * d.size);
        angle = angle || 360;
    
        // Determine the direction of facing, the angle of vision, and the angles of boundary rays
        const limitAngle = angle.between(0, 360, false);
        const aMin = limitAngle ? normalizeRadians(toRadians(rotation + 90 - (angle / 2))) : -Math.PI;
        const aMax = limitAngle ? aMin + toRadians(angle) : Math.PI;
    
        // Cast sight rays needed to determine the polygons
        let rays = this._castSightRays(x, y, distance, cullDistance, density, limitAngle, aMin, aMax);
    
        const start = performance.now();
        // Iterate over rays and record their points of collision with blocking walls
        walls = walls || canvas.walls.blockVision;
        for ( let r of rays ) {
    
          // Special case: the central ray in a limited angle
          if ( r._isCenter ) {
            r.unrestricted = r.limited = r.project(0.5);
            continue;
          }
    
          // Normal case: identify the closest collision point both unrestricted (LOS) and restricted (FOV)
/// CHANGE HERE
          let collision = WallsLayer.getWallCollisionsForRay(r, walls, {mode: "closest", elevation});

          r.unrestricted = collision || { x: r.B.x, y: r.B.y, t0: 1, t1: 0};
          r.limited = ( r.unrestricted.t0 <= limit ) ? r.unrestricted : r.project(limit);
        }
        const end = performance.now();
        console.log(`total time calculating collisions for all rays: ${end-start}`);
    
        // Reduce collisions and limits to line-of-sight and field-of-view polygons
        let [losPoints, fovPoints] = rays.reduce((acc, r) => {
          acc[0].push(r.unrestricted.x, r.unrestricted.y);
          acc[1].push(r.limited.x, r.limited.y);
          return acc;
        }, [[], []]);
    
        // Construct visibility polygons and return them with the rays
        const los = new PIXI.Polygon(...losPoints);
        const fov = new PIXI.Polygon(...fovPoints);
        return {rays, los, fov};
      }
}

export function WallsLayer_getWallCollisionsForRay() {
  WallsLayer.getWallCollisionsForRay = function(ray, walls, {mode="all", elevation=0}={}) {
    // Copied from WallsLayer.getWallCollisionsForRay. Foundry version 0.6.4, foundry.js:34155

    // Establish initial data
    const collisions = {};
    const isAny = mode === "any";
    const bounds = [ray.angle - (Math.PI/2), ray.angle + (Math.PI/2)];

    // const preLoop = performance.now();
    // let cumulativeDelta = 0;

    // Iterate over provided walls
    for (let w of walls) {

      // Skip open doors
      if ( (w.data.door > WALL_DOOR_TYPES.NONE) && (w.data.ds === WALL_DOOR_STATES.OPEN ) ) continue;

      // Skip directional walls where the ray angle is not in the same hemisphere as the wall direction
      if ( w.direction !== null ) {
        if ( !w.isDirectionBetweenAngles(...bounds) ) continue;
      }

      // const start = performance.now();
      const { wallHeightTop, wallHeightBottom } = getWallBounds(w);
      // const end = performance.now();
      // cumulativeDelta += end-start;

      if (elevation < wallHeightBottom || elevation >= wallHeightTop) continue;

      // Test for intersections
      let i = ray.intersectSegment(w.coords);
      if ( i && i.t0 > 0 ) {
        if ( isAny ) return true;
        i.x = Math.round(i.x);
        i.y = Math.round(i.y);

        // Ensure uniqueness of the collision point
        let pt = `${i.x}.${i.y}`;
        const c = collisions[pt];
        if ( c ) {
          c.sense = Math.min(w.data.sense, c.sense);
        }
        else {
          i.sense = w.data.sense;
          collisions[pt] = i;
        }
      }
    }

    // const postLoop = performance.now();

    // console.log(`total time in walls loop: ${postLoop - preLoop}`);
    // console.log(`wall height time in walls loop: ${cumulativeDelta}`);

    // Return results
    if ( isAny ) return false;
    if ( mode === "closest" ) return this._getClosestCollisionPoint(ray, Object.values(collisions));
    return Object.values(collisions);
  }
}