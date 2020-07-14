// PF1 and D35E versions of the patches.

export function PF1Patch_SightLayer_updateToken() {
    // Copied from PF1 version 0.65, module/low-light-vision.js:147
    SightLayer.prototype.updateToken = function(token, {defer=false, deleted=false, walls=null, forceUpdateFog=false}={}) {
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
            const darkvision = this.hasDarkvision() ? token.getDarkvisionRadius() : 0;
            if ((dim === 0) && (bright === 0) && (darkvision === 0)) dim = canvas.dimensions.size * 0.6;
            const radius = Math.max(Math.abs(dim), Math.abs(bright), Math.abs(darkvision));
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
            bright: Math.max(bright, darkvision),
            color: "#ffffff",
            alpha: 1,
            });
            this.sources.vision.set(sourceId, source);
        
            // Update fog exploration for the token position
            this.updateFog(center.x, center.y, Math.max(dim, bright, darkvision), token.data.sightAngle !== 360, forceUpdateFog);
        }
        
        // Prepare light sources
        if ( isLightSource ) {
        
            // Compute light emission polygons
            const dim = token.dimLightRadius;
            const bright = token.brightLightRadius;
            const radius = Math.max(Math.abs(dim), Math.abs(bright));
            const {fov} = this.constructor.computeSight(center, radius, {
            angle: token.data.lightAngle,
            cullMult: cullMult,
            cullMin: cullMin,
            cullMax: cullMax,
            density: 6,
            rotation: token.data.rotation,
            walls: walls,
/// CHANGE HERE
            elevation: token.data.elevation
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
    };
}

export function PF1Patch_Token_getDarkvisionSight() {
    // Copied from PF1 version 0.65, module/low-light-vision.js:118
    Token.prototype.getDarkvisionSight = function() {
        const radius = this.getDarkvisionRadius();
        if (!radius) return null;
      
        const walls = canvas.walls.blockVision;
        const globalLight = canvas.scene.data.globalLight;
        const maxR = globalLight ? Math.max(canvas.dimensions.width, canvas.dimensions.height) : null;
        let [cullMult, cullMin, cullMax] = canvas.sight._cull;
        if (globalLight) cullMin = maxR;
      
        return canvas.sight.constructor.computeSight(this.getSightOrigin(), radius, {
            angle: this.data.angle,
            cullMult: cullMult,
            cullMin: cullMin,
            cullMax: cullMax,
            density: 6,
            rotation: this.data.rotation,
            walls: walls,
/// CHANGE HERE
            elevation: this.data.elevation
        });
    };
}