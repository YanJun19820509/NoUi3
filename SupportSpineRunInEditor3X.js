if (cc.env.EDITOR) {
  cc.game.once(cc.Game.EVENT_ENGINE_INITED, function () {
    cc.js.mixin(cc.internal.SpineSkeleton.prototype, {
      update(dt) {
        // if (this.paused) return;
        dt *= this._timeScale * 1.0;

        if (this.isAnimationCached()) {
          // Cache mode and has animation queue.
          if (this._isAniComplete) {
            if (this._animationQueue.length === 0 && !this._headAniInfo) {
              const frameCache = this._frameCache;

              if (frameCache && frameCache.isInvalid()) {
                frameCache.updateToFrame();
                const frames = frameCache.frames;
                this._curFrame = frames[frames.length - 1];
              }

              return;
            }

            if (!this._headAniInfo) {
              this._headAniInfo = this._animationQueue.shift();
            }

            this._accTime += dt;

            if (this._accTime > this._headAniInfo.delay) {
              const aniInfo = this._headAniInfo;
              this._headAniInfo = null;
              this.setAnimation(0, aniInfo.animationName, aniInfo.loop);
            }

            return;
          }

          this._updateCache(dt);
        } else {
          this._updateRealtime(dt);
        }
      },
      updateAnimation(dt) {
        this.markForUpdateRenderData();
        if (this.paused) return;

        dt *= this._timeScale * timeScale;
        if (this.isAnimationCached()) {
          // Cache mode and has animation queue.
          if (this._isAniComplete) {
            if (this._animationQueue.length === 0 && !this._headAniInfo) {
              const frameCache = this._frameCache;
              if (frameCache && frameCache.isInvalid()) {
                frameCache.updateToFrame();
                const frames = frameCache.frames;
                this._curFrame = frames[frames.length - 1];
              }
              return;
            }
            if (!this._headAniInfo) {
              this._headAniInfo = this._animationQueue.shift();
            }
            this._accTime += dt;
            if (this._accTime > this._headAniInfo.delay) {
              const aniInfo = this._headAniInfo;
              this._headAniInfo = null;
              this.setAnimation(0, aniInfo.animationName, aniInfo.loop);
            }
            return;
          }

          this._updateCache(dt);
        } else {
          this._updateRealtime(dt);
        }
      }
    });
  });
}
