//drawcall优化，对引擎相关代码的扩充或修改

import { dynamicAtlasManager, js, Widget,  director, BlockInputEvents,  ScrollView, Layout, SpriteFrame, Sprite,  Label, RenderTexture, Node, RenderComponent,  math, WebGL2Device } from "cc";
import { EDITOR, DEBUG } from "cc/env";
import { no } from "../no";
import { MaxRects } from "./MaxRects";


let mixEngine = function () {
    let _curTmpAtlas = null;
    let _tmpAtlases = [];
    let _openEnableTmp = true;
    let _debugNode = null;
    let _textureSize = 1024;
    let _maxFrameSize = 512;
    const space = 2;
    let o_insertSpriteFrame = dynamicAtlasManager.insertSpriteFrame;
    js.mixin(dynamicAtlasManager, {
        packToDynamicAtlas(comp, frame) {
            if (EDITOR) return;
            if (comp instanceof Label && !(frame instanceof SpriteFrame)) {
                if (comp.string == '') return;
                frame._texture._uuid = comp.string + "_" + comp.node.getComponent(RenderComponent).color + "_" + comp.fontSize + comp.fontFamily;
            }
            let packedFrame = dynamicAtlasManager['insertSpriteFrame1'](frame, comp);
            if (packedFrame) {
                frame._setDynamicAtlasFrame(packedFrame);
            }
            let material = comp._materials[0];
            if (!material) return;

            if (frame._texture && material.getProperty('texture') !== frame._texture._texture) {
                // texture was packed to dynamic atlas, should update uvs
                comp._vertsDirty = true;
                comp._updateMaterial();
            }
        },
        insertSpriteFrame1(spriteFrame, comp) {
            if (EDITOR || !spriteFrame || !spriteFrame._texture || !spriteFrame._texture._texture) return null;
            if (_curTmpAtlas && spriteFrame._rect.height <= 800) {
                return this._insertTmpSpriteFrame(spriteFrame, comp);
            }
            return null;//o_insertSpriteFrame(spriteFrame);
        },
        showDebug: DEBUG && function (show) {
            if (show) {
                if (!_debugNode || !_debugNode.isValid) {

                    _debugNode = new Node('DYNAMIC_ATLAS_DEBUG_NODE');
                    let widget = _debugNode.addComponent(Widget);
                    widget.isAlignTop = true;
                    widget.isAlignLeft = true;
                    widget.isAlignBottom = true;
                    widget.isAlignRight = true;
                    widget.top = 0;
                    widget.left = 0;
                    widget.bottom = 0;
                    widget.right = 0;
                    _debugNode.zIndex = Number.MAX_VALUE;
                    _debugNode.parent = director.getScene();

                    _debugNode.addComponent(BlockInputEvents);

                    // _debugNode.groupIndex = Node.BuiltinGroupIndex.DEBUG;
                    // Camera._setupDebugCamera();

                    let scroll = _debugNode.addComponent(ScrollView);

                    let content = new Node('CONTENT');
                    let layout = content.addComponent(Layout);
                    layout.type = Layout.Type.VERTICAL;
                    layout.resizeMode = Layout.ResizeMode.NONE;
                    content.parent = _debugNode;

                    scroll.content = content;

                    let _createNode = function (texture, parent) {
                        let node = new Node('ATLAS');
                        no.width(node, texture.width);
                        no.height(node, texture.height);
                        let spriteFrame = new SpriteFrame();
                        spriteFrame.texture = texture;

                        let sprite = node.addComponent(Sprite);
                        sprite.spriteFrame = spriteFrame;

                        node.parent = parent;
                    }

                    if (_curTmpAtlas) {
                        no.width(content,_curTmpAtlas._texture.width);
                        no.height(content,_curTmpAtlas._texture.height);
                        _createNode(_curTmpAtlas._texture, content);
                        console.error('curTmpAtlas---' + _curTmpAtlas._texture._id);
                    } else {
                        // content.width = _textureSize;
                        // content.height = _textureSize * _atlases.length;
                        // for (let i = 0, n = _atlases.length; i < n; i++) {
                        //     _createNode(_atlases[i]._texture, content);
                        // }
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
                if (spriteFrame instanceof SpriteFrame)
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

    js.mixin(Atlas.prototype, {
        fetchSpriteFrameAsync(spriteFrame) {
            if (!this._dynamicTextureRect) {
                this._dynamicTextureRect = {};
                return null;
            }
            let info;
            if (spriteFrame instanceof SpriteFrame) {
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
                this._maxRect = new MaxRects(this._width, this._height);
            }
            let _uuid;
            if (spriteFrame instanceof SpriteFrame)
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
            if (spriteFrame instanceof SpriteFrame) {
                if (spriteFrame['_original'])
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
                let rect = math.rect(r.x, r.y, isRotated ? r.height : r.width, isRotated ? r.width : r.height);
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
            if (dynamicAtlasManager.textureBleeding) {
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

            const gl = (director.root.device as WebGL2Device).gl;
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
                        dynamicAtlasManager['updateAtlasComp'](key, this._texture._id);
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
                    if (comp instanceof Sprite)
                        comp['_assembler']!.updateRenderData!(comp);
                    else
                        comp.updateRenderData();
                }
            }
        }
    });

    js.mixin(RenderTexture.prototype, {
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

if (!EDITOR && DEBUG) {
    let a = setInterval(function () {
        if (dynamicAtlasManager) {
            mixEngine();
            clearInterval(a);
        }
    }, 20);
}