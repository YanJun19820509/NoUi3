//drawcall优化，对引擎相关代码的扩充或修改
const MaxRects = require('./MaxRects');

let mixEngine = function () {
    let _curTmpAtlas = null;
    let _tmpAtlases = [];
    let _openEnableTmp = true;
    let _debugNode = null;
    let _textureSize = 1024;
    let _maxFrameSize = 512;
    const space = 2;
    let o_insertSpriteFrame = cc.dynamicAtlasManager.insertSpriteFrame;
    cc.js.mixin(cc.dynamicAtlasManager, {
        insertSpriteFrame(spriteFrame, comp) {
            if (CC_EDITOR || !spriteFrame || !spriteFrame._texture || !spriteFrame._texture._texture) return null;
            if (_curTmpAtlas && spriteFrame && spriteFrame._rect.width <= cc.winSize.width && spriteFrame._rect.height <= 700) {
                return this._insertTmpSpriteFrame(spriteFrame, comp);
            }
            return null;//o_insertSpriteFrame(spriteFrame);
        },
        showDebug: CC_DEBUG && function (show) {
            if (show) {
                if (!_debugNode || !_debugNode.isValid) {

                    _debugNode = new cc.Node('DYNAMIC_ATLAS_DEBUG_NODE');
                    let widget = _debugNode.addComponent(cc.Widget);
                    widget.isAlignTop = true;
                    widget.isAlignLeft = true;
                    widget.isAlignBottom = true;
                    widget.isAlignRight = true;
                    widget.top = 0;
                    widget.left = 0;
                    widget.bottom = 0;
                    widget.right = 0;
                    _debugNode.zIndex = cc.macro.MAX_ZINDEX;
                    _debugNode.parent = cc.director.getScene();

                    _debugNode.addComponent(cc.BlockInputEvents);

                    _debugNode.groupIndex = cc.Node.BuiltinGroupIndex.DEBUG;
                    cc.Camera._setupDebugCamera();

                    let scroll = _debugNode.addComponent(cc.ScrollView);

                    let content = new cc.Node('CONTENT');
                    let layout = content.addComponent(cc.Layout);
                    layout.type = cc.Layout.Type.VERTICAL;
                    layout.resizeMode = cc.Layout.ResizeMode.NONE;
                    content.parent = _debugNode;

                    scroll.content = content;

                    let _createNode = function (texture, parent) {
                        let node = new cc.Node('ATLAS');
                        node.width = texture.width;
                        node.height = texture.height;
                        let spriteFrame = new cc.SpriteFrame();
                        spriteFrame.setTexture(texture);

                        let sprite = node.addComponent(cc.Sprite);
                        sprite.spriteFrame = spriteFrame;

                        node.parent = parent;
                    }

                    if (_curTmpAtlas) {
                        content.width = _curTmpAtlas._texture.width;
                        content.height = _curTmpAtlas._texture.height;
                        _createNode(_curTmpAtlas._texture, content);
                        console.error('curTmpAtlas---' + _curTmpAtlas._texture._id);
                    } else {
                        content.width = _textureSize;
                        content.height = _textureSize * _atlases.length;
                        for (let i = 0, n = _atlases.length; i < n; i++) {
                            _createNode(_atlases[i]._texture, content);
                        }
                    }
                }
                return _debugNode;
            } else {
                if (_debugNode) {
                    _debugNode.parent = null;
                    _debugNode = null;
                }
            }
        },
        setTmpAtlas(name, size) {
            //等宽高设置有利于shader的计算
            size = size || 1;
            if (!_openEnableTmp) return;
            let atlas = new this.Atlas(_textureSize * size, _textureSize * size);
            atlas._texture._id = name;
            _curTmpAtlas = atlas;
            _tmpAtlases[_tmpAtlases.length] = atlas;
        },

        removeTmpAtlas(name) {
            if (!_openEnableTmp) return;
            for (let i = 0, n = _tmpAtlases.length; i < n; i++) {
                let atlas = _tmpAtlases[i];
                if (atlas._texture._id == name) {
                    _tmpAtlases.splice(i, 1);
                    if (_curTmpAtlas._texture._id == atlas._texture._id) {
                        _curTmpAtlas = _tmpAtlases[_tmpAtlases.length - 1];
                    }
                    this._destroyAtlas(atlas);
                    break;
                }
            }
        },

        _destroyAtlas(atlas) {
            // setTimeout(() => {
            atlas.destroy();
            atlas = null;
            // }, 50);
        },

        tmpAtlasByName(name) {
            if (!name) return null;
            for (let i = 0, n = _tmpAtlases.length; i < n; i++) {
                let atlas = _tmpAtlases[i];
                if (atlas._texture._id == name) {
                    return atlas;
                }
            }
            return null;
        },

        get tmpAtlasNum() {
            return _tmpAtlases.length;
        },

        get currentAtlasName() {
            if (_curTmpAtlas)
                return _curTmpAtlas._texture._id;
            return null;
        },

        _insertTmpSpriteFrame(spriteFrame, comp) {
            // let atlas = this.tmpAtlasByName(spriteFrame['_tmpAtlasId']);
            if (spriteFrame._texture._id == _curTmpAtlas._texture._id) {
                let _uuid;
                if (spriteFrame instanceof cc.SpriteFrame)
                    _uuid = spriteFrame._uuid;
                else _uuid = spriteFrame._texture._uuid;
                _curTmpAtlas.addToInnerComponentes(_uuid, comp);
                return null;
            }
            if (!spriteFrame._original && !spriteFrame._texture._texture) return null;

            let frame = _curTmpAtlas.insertSpriteFrameAsync(spriteFrame, comp);
            return frame;
        },

        updateAtlasComp(uuid, name) {
            for (let i = 0, n = _tmpAtlases.length; i < n; i++) {
                let atlas = _tmpAtlases[i];
                if (atlas._texture._id == name) {
                    continue;
                }
                atlas.updateComp(uuid);
            }
        }
    });

    cc.js.mixin(cc.dynamicAtlasManager.Atlas.prototype, {
        fetchSpriteFrameAsync(spriteFrame) {
            if (!this._dynamicTextureRect) {
                this._dynamicTextureRect = {};
                return null;
            }
            let info;
            if (spriteFrame instanceof cc.SpriteFrame) {
                if (this._dynamicTextureRect[spriteFrame._uuid]) return null;
            } else info = this._dynamicTextureRect[spriteFrame._texture._uuid];
            if (!info) return null;
            let frame = {
                x: info.x,
                y: info.y,
                texture: this._texture
            };
            if (!this._innerSpriteFrames.includes(spriteFrame)) {
                this._innerSpriteFrames.push(spriteFrame);
            }
            spriteFrame['_tmpAtlasId'] = this._texture._id;
            return frame;
        },

        insertSpriteFrameAsync(spriteFrame, comp) {
            if (!this._dynamicTextureRect) {
                this._dynamicTextureRect = {};
            }
            if (!this._maxRect) {
                this._maxRect = new MaxRects.MaxRects(this._width, this._height);
            }
            let _uuid;
            if (spriteFrame instanceof cc.SpriteFrame)
                _uuid = spriteFrame._uuid;
            else _uuid = spriteFrame._texture._uuid;
            if (this._dynamicTextureRect[_uuid]) {
                this.addToInnerComponentes(_uuid, comp);
                if (spriteFrame['_tmpAtlasId'] == this._texture._id && spriteFrame._texture._id == this._texture._id) {
                    return null;
                } else {
                    spriteFrame['_tmpAtlasId'] = this._texture._id;
                    let info = this._dynamicTextureRect[_uuid];
                    return {
                        x: info.x,
                        y: info.y,
                        texture: this._texture
                    };
                }
            }

            let rect = spriteFrame._rect;
            let isRotated = spriteFrame.isRotated ? spriteFrame.isRotated() : false;


            let width = isRotated ? rect.height : rect.width,
                height = isRotated ? rect.width : rect.height;

            let p = this._maxRect.find(width, height);
            if (!p) return null;
            let x = p.x, y = p.y;

            spriteFrame['_tmpAtlasId'] = this._texture._id;
            if (spriteFrame instanceof cc.SpriteFrame) {
                if (spriteFrame._original)
                    spriteFrame._resetDynamicAtlasFrame();
            }

            this.drawImageAt(spriteFrame, x, y);

            this._dynamicTextureRect[_uuid] = {
                x: x,
                y: y
            };
            this.addToInnerComponentes(_uuid, comp);

            let frame = {
                x: x,
                y: y,
                texture: this._texture
            }

            this._count++;

            this._innerSpriteFrames.push(spriteFrame);
            return frame;
        },

        addToInnerComponentes(_uuid, comp) {
            if (!this._innerComponentes) this._innerComponentes = {};
            this._innerComponentes[_uuid] = this._innerComponentes[_uuid] || [];
            if (!this._innerComponentes[_uuid].includes(comp))
                this._innerComponentes[_uuid][this._innerComponentes[_uuid].length] = comp;
        },

        drawImageAt(spriteFrame, x, y) {
            let texture = spriteFrame._texture;
            let r = spriteFrame._rect;
            let image = texture._image;
            let premultiplyAlpha = texture._premultiplyAlpha;
            if (image && image.width == r.width && image.height == r.height) {
                this._setSubImage(image, x, y, premultiplyAlpha);
                this._dirty = true;
            } else {
                let isRotated = spriteFrame.isRotated();
                let rect = cc.rect(r.x, r.y, isRotated ? r.height : r.width, isRotated ? r.width : r.height);
                if (typeof createImageBitmap !== 'undefined' && image) {
                    createImageBitmap(image, rect.x, rect.y, rect.width, rect.height).then(img => {
                        this._setSubImage(img, x, y, premultiplyAlpha);
                        this._dirty = true;
                    });
                } else {
                    let img = this._createImageData(texture, rect);
                    this._setSubImage(img, x, y, premultiplyAlpha);
                    this._dirty = true;
                }
            }
        },

        _setSubImage(img, x, y, premultiplyAlpha) {
            if (cc.dynamicAtlasManager.textureBleeding) {
                if (img.width <= 8 || img.height <= 8) {
                    this._texture.drawImageAt(img, x - 1, y - 1, premultiplyAlpha);
                    this._texture.drawImageAt(img, x - 1, y + 1, premultiplyAlpha);
                    this._texture.drawImageAt(img, x + 1, y - 1, premultiplyAlpha);
                    this._texture.drawImageAt(img, x + 1, y + 1, premultiplyAlpha);
                }

                this._texture.drawImageAt(img, x - 1, y, premultiplyAlpha);
                this._texture.drawImageAt(img, x + 1, y, premultiplyAlpha);
                this._texture.drawImageAt(img, x, y - 1, premultiplyAlpha);
                this._texture.drawImageAt(img, x, y + 1, premultiplyAlpha);
            }

            this._texture.drawImageAt(img, x, y, premultiplyAlpha);
        },

        _createImageData(texture, rect) {
            let input = this._getPixels(rect, texture);
            let canvas = document.createElement("canvas");
            let ctx = canvas.getContext("2d");
            let imageData = ctx.createImageData(rect.width, rect.height);
            let i = 0,
                k = 0,
                data = imageData.data,
                length = data.length;
            while (i < length) {
                data[i++] = input[k++];
                data[i++] = input[k++];
                data[i++] = input[k++];
                data[i++] = input[k++];
            }
            return imageData;
        },
        //读取texture一定区域内的像素数据
        _getPixels(rect, texture) {
            let gl = cc.game._renderContext;

            let framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._texture._glID, 0);

            let pixels = new Uint8Array(rect.width * rect.height * 4);
            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE) {
                gl.readPixels(rect.x, rect.y, rect.width, rect.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            }

            gl.deleteFramebuffer(framebuffer);

            return pixels;
        },

        reset() {
            console.error(this._maxRect?._rects.length);
            this._x = space;
            this._y = space;
            this._nexty = space;

            let frames = this._innerSpriteFrames;
            for (let i = 0, l = frames.length; i < l; i++) {
                let frame = frames[i];
                if (!frame.isValid) {
                    continue;
                }
                delete frame['_tmpAtlasId'];
                frame._resetDynamicAtlasFrame();
            }

            if (this._innerComponentes) {
                for (const key in this._innerComponentes) {
                    if (Object.hasOwnProperty.call(this._innerComponentes, key)) {
                        cc.dynamicAtlasManager.updateAtlasComp(key, this._texture._id);
                        this.updateComp(key);
                    }
                }
            }
            this._innerSpriteFrames.length = 0;
            this._dynamicTextureRect = {};
            this._innerComponentes = {};
        },

        updateComp(uuid) {
            if (!this._innerComponentes) return;
            let comps = this._innerComponentes[uuid] || [];
            for (let i = 0, n = comps.length; i < n; i++) {
                let comp = comps[i];
                if (comp.isValid) {
                    if (comp instanceof cc.Sprite)
                        comp._assembler.updateRenderData(comp);
                    else
                        comp.setVertsDirty();
                }
            }
        }
    });

    cc.js.mixin(cc.Assembler2D.prototype, {
        packToDynamicAtlas(comp, frame) {
            if (CC_TEST || !frame) return;
            if (cc.dynamicAtlasManager) {
                if (comp instanceof cc.Label && !(frame instanceof cc.SpriteFrame)) {
                    if (comp.string == '') return;
                    frame._texture._uuid = comp.string + "_" + comp.node.color + "_" + comp.fontSize + comp.fontFamily;
                }
                let packedFrame = cc.dynamicAtlasManager.insertSpriteFrame(frame, comp);
                if (packedFrame) {
                    frame._setDynamicAtlasFrame(packedFrame);
                }
            }
            let material = comp._materials[0];
            if (!material) return;

            if (frame._texture && material.getProperty('texture') !== frame._texture._texture) {
                // texture was packed to dynamic atlas, should update uvs
                comp._vertsDirty = true;
                comp._updateMaterial();
            }
        }
    });

    cc.js.mixin(cc.RenderTexture.prototype, {
        drawImageAt(img, x, y, premultiplyAlpha) {
            this._texture.updateSubImage({
                x,
                y,
                image: img,
                width: img.width,
                height: img.height,
                level: 0,
                flipY: false,
                premultiplyAlpha: premultiplyAlpha
            })
        }
    });
};

if (!CC_EDITOR && CC_DEBUG) {
    let a = setInterval(function () {
        if (cc.Assembler2D) {
            mixEngine();
            clearInterval(a);
        }
    }, 20);
}