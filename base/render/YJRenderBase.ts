import { Mat4, RenderData, Texture2D, UIRenderer, UIVertexFormat, Vec3, ccclass, property, Attribute } from '../../yj';
/**
 * 自定义基础渲染组件
 */
@ccclass('YJRenderBase')
export class YJRenderBase extends UIRenderer {
    @property({ type: Texture2D })
    public get texture(): Texture2D {
        return this._texture;
    }

    public set texture(v: Texture2D) {
        this._texture = v;
        this.destroyRenderData();
        this._flushAssembler();
    }

    @property({ serializable: true })
    protected _texture: Texture2D = null;

    private dataOffset: number = 0;

    /**
     * 返回顶点数据结构，子类可根据需要重写此方法，返回自定义的顶点数据结构。
     * @returns {Attribute[]} 顶点数据结构。
     */
    protected vertexFormat(): Attribute[] {
        return UIVertexFormat.vfmtPosUvColor;
    }

    //在preload时引擎会自动调用此方法，当更换texture或material时需要调用此方法
    protected _flushAssembler() {
        if (this._assembler !== YJAssemblerBase) {
            this.destroyRenderData();
            this._assembler = YJAssemblerBase;
        }

        if (!this._renderData) {
            if (this._assembler && this._assembler.createData) {
                this._renderData = this._assembler.createData(this.vertexFormat());
                this._renderData!.material = this.material;
            }
        }
    }
    //引擎自动调用，无需手动调用
    protected _render(render: any) {
        render.commitComp(this, this._renderData, this._texture, this._assembler!, null);
    }

    /**
     * 重置renderData，当需要改变顶点数据长度时，先调用此方法
     */
    protected resetRenderData() {
        const renderData = this._renderData;
        renderData.dataLength = 0;
        renderData.resize(0, 0);
        this.dataOffset = 0;
    }

    /**
     * 设置顶点数据，此方法不会改变顶点数据长度，如果需要改变顶点数据长度，请调用addRenderData 方法
     * @param uv 
     * @param rotated 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     * @returns 
     */
    protected setRenderData(uv: number[], rotated: boolean, x: number, y: number, width: number, height: number) {
        const renderData = this._renderData;
        if (this.dataOffset >= renderData.dataLength) {
            this.dataOffset = 0;
        }

        const dataOffset = this.dataOffset;
        this.updateRenderData(dataOffset, uv, rotated, x, y, width, height);
        // const dataList = renderData.data;

        // if (!rotated) {
        //     dataList[dataOffset].u = uv[0];
        //     dataList[dataOffset].v = uv[1];
        //     dataList[dataOffset + 1].u = uv[2];
        //     dataList[dataOffset + 1].v = uv[3];
        //     dataList[dataOffset + 2].u = uv[4];
        //     dataList[dataOffset + 2].v = uv[5];
        //     dataList[dataOffset + 3].u = uv[6];
        //     dataList[dataOffset + 3].v = uv[7];
        // } else {
        //     dataList[dataOffset].u = uv[4];
        //     dataList[dataOffset].v = uv[5];
        //     dataList[dataOffset + 1].u = uv[0];
        //     dataList[dataOffset + 1].v = uv[1];
        //     dataList[dataOffset + 2].u = uv[6];
        //     dataList[dataOffset + 2].v = uv[7];
        //     dataList[dataOffset + 3].u = uv[2];
        //     dataList[dataOffset + 3].v = uv[3];
        // }

        // dataList[dataOffset].x = x;
        // dataList[dataOffset].y = y - height;
        // dataList[dataOffset + 1].x = x + width;
        // dataList[dataOffset + 1].y = y - height;
        // dataList[dataOffset + 2].x = x;
        // dataList[dataOffset + 2].y = y;
        // dataList[dataOffset + 3].x = x + width;
        // dataList[dataOffset + 3].y = y;
        this.dataOffset += 4;
    }

    /**
     * 添加顶点数据，此方法会改变顶点数据长度，请先调用resetRenderData方法重置顶点数据
     * @param uv 
     * @param rotated 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     */
    protected addRenderData(uv: number[], rotated: boolean, x: number, y: number, width: number, height: number) {
        const renderData = this._renderData;
        renderData.dataLength += 4;
        renderData.resize(renderData.dataLength, renderData.dataLength / 2 * 3);
        this.setRenderData(uv, rotated, x, y, width, height);
    }

    /**
     * 修改指定dataOffset的顶点数据，dataOffset从0开始，如果dataOffset大于等于当前顶点数据长度，则不修改任何数据
     * @param dataOffset 
     * @param uv 
     * @param rotated 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     */
    protected updateRenderData(dataOffset: number, uv?: number[], rotated?: boolean, x?: number, y?: number, width?: number, height?: number) {
        const renderData = this._renderData;
        const dataList = renderData.data;
        if (dataOffset > renderData.dataLength - 4) return;
        if (uv?.length > 0) {
            if (!rotated) {
                dataList[dataOffset].u = uv[0];
                dataList[dataOffset].v = uv[1];
                dataList[dataOffset + 1].u = uv[2];
                dataList[dataOffset + 1].v = uv[3];
                dataList[dataOffset + 2].u = uv[4];
                dataList[dataOffset + 2].v = uv[5];
                dataList[dataOffset + 3].u = uv[6];
                dataList[dataOffset + 3].v = uv[7];
            } else {
                dataList[dataOffset].u = uv[4];
                dataList[dataOffset].v = uv[5];
                dataList[dataOffset + 1].u = uv[0];
                dataList[dataOffset + 1].v = uv[1];
                dataList[dataOffset + 2].u = uv[6];
                dataList[dataOffset + 2].v = uv[7];
                dataList[dataOffset + 3].u = uv[2];
                dataList[dataOffset + 3].v = uv[3];
            }
        }

        if (x != null) {
            dataList[dataOffset].x = x;
            dataList[dataOffset + 2].x = x;
            if (width != null) {
                dataList[dataOffset + 1].x = x + width;
                dataList[dataOffset + 3].x = x + width;
            }
        }
        if (y != null) {
            dataList[dataOffset + 2].y = y;
            dataList[dataOffset + 3].y = y;
            if (height != null) {
                dataList[dataOffset].y = y - height;
                dataList[dataOffset + 1].y = y - height;
            }
        }
    }
}

const vec3_temp = new Vec3();
const _worldMatrix = new Mat4();
const YJAssemblerBase = {
    createData(vertexFormat?: Attribute[]) {
        return RenderData.add(vertexFormat);
    },

    updateRenderData(comp: UIRenderer) {
        const texture: Texture2D = comp['texture'];

        this.updateUVs(comp);// dirty need
        this.updateColor(comp);// dirty need

        const renderData = comp.renderData;
        if (renderData && texture) {
            if (renderData.vertDirty) {
                this.updateVertexData(comp);
            }
            renderData.updateRenderData(comp, texture);
        }
    },
    //更新顶点的世界坐标
    updateWorldVerts(comp: UIRenderer) {
        const renderData = comp.renderData!;
        const dataList = renderData.data;
        const chunk = renderData.chunk;
        const vData = chunk.vb;
        const vertexCount = renderData.vertexCount;

        comp.node.getWorldMatrix(_worldMatrix);

        let vertexOffset = 0;
        for (let i = 0; i < vertexCount; i++) {
            const vert = dataList[i];
            Vec3.set(vec3_temp, vert.x, vert.y, 0);
            Vec3.transformMat4(vec3_temp, vec3_temp, _worldMatrix);
            vData[vertexOffset++] = vec3_temp.x;
            vData[vertexOffset++] = vec3_temp.y;
            vData[vertexOffset++] = vec3_temp.z;
            vertexOffset += 6;
        }
    },

    fillBuffers(comp: UIRenderer, renderer: any) {
        if (comp === null) {
            return;
        }

        const renderData = comp.renderData!;
        if (comp.node.hasChangedFlags || renderData.vertDirty) {
            this.updateWorldVerts(comp);
        }

        if (renderData.vertDirty) {
            this.updateUVs(comp);
            this.updateColor(comp);
            renderData.vertDirty = false;
        }
        this.updateIndexes(comp);
    },

    updateVertexData(comp: UIRenderer) {

    },

    updateUVs(comp: UIRenderer) {
        const renderData = comp.renderData!;
        const vData = renderData.chunk.vb;
        const vertexCount = renderData.vertexCount;
        const dataList = renderData.data;

        let vertexOffset = 3;
        for (let i = 0; i < vertexCount; i++) {
            const vert = dataList[i];
            vData[vertexOffset++] = vert.u;
            vData[vertexOffset++] = vert.v;
            vertexOffset += 7;
        }
    },

    updateIndexes(comp: UIRenderer) {
        const renderData = comp.renderData!;
        const chunk = renderData.chunk;
        const bid = chunk.bufferId;
        const vid = chunk.vertexOffset;
        const meshBuffer = chunk.vertexAccessor.getMeshBuffer(chunk.bufferId);
        const ib = chunk.vertexAccessor.getIndexBuffer(bid);
        const vertexCount = renderData.vertexCount;
        let indexOffset = meshBuffer.indexOffset;
        for (let i = 0, count = vertexCount / 4; i < count; i++) {
            const start = vid + i * 4;
            ib[indexOffset++] = start;
            ib[indexOffset++] = start + 1;
            ib[indexOffset++] = start + 2;
            ib[indexOffset++] = start + 1;
            ib[indexOffset++] = start + 3;
            ib[indexOffset++] = start + 2;
        }
        meshBuffer.indexOffset += renderData.indexCount;
    },

    updateColor(comp: UIRenderer) {
        const renderData = comp.renderData!;
        const vData = renderData.chunk.vb;
        const vertexCount = renderData.vertexCount;
        const floatStride = renderData.floatStride;
        let colorOffset = 5;
        const color = comp.color;
        const colorR = color.r / 255;
        const colorG = color.g / 255;
        const colorB = color.b / 255;
        const colorA = color.a / 255;
        for (let i = 0; i < vertexCount; i++) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            vData[colorOffset + 3] = colorA;
            colorOffset += floatStride;
        }
    },
};

