import { no } from '../../no';
import { Mat4, RenderData, Texture2D, UIRenderer, UIVertexFormat, Vec3, ccclass, property, Attribute, Color } from '../../yj';
/**
 * 自定义基础渲染组件
 */
export type RenderDataType = { uv?: number[], xy?: number[], rotated?: boolean, colors?: Color[], colors2?: Color[] };
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

    public renderColors: Color[] = [];
    public renderColors2: Color[] = [];

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
                this.initRenderData();
            }
        }
        this.onFlushAssembler();
    }
    //引擎自动调用，无需手动调用
    protected _render(render: any) {
        render.commitComp(this, this._renderData, this._texture, this._assembler!, null);
    }

    /**
     * 初始化renderData，当需要改变顶点数据长度时，先调用此方法
     */
    protected initRenderData() {
        const renderData = this._renderData;
        renderData.dataLength = 0;
        renderData.resize(0, 0);
        renderData.vertDirty = true;
        this.dataOffset = 0;
        this.renderColors = [];
        this.renderColors2 = [];
    }

    /**
     * 设置默认顶点数据
     */
    protected setDefaultRenderData() {
        this.addRenderData({
            uv: this.getDefaultUV(),
            xy: this.getDefaultXY()
        })
    }

    /**
     * 设置顶点数据，此方法不会改变顶点数据长度，如果需要改变顶点数据长度，请调用addRenderData 方法
     * @param d
     * @param colors 颜色数组，如果不需要设置颜色，请传入null，否则传入颜色数组，数组长度最大为4，即4个顶点对应4个颜色值。
     * @param colors2 颜色数组，如果不需要设置颜色，请传入null，否则传入颜色数组，数组长度最大为4，即4个顶点对应4个颜色值。
     */
    protected setRenderData(d: RenderDataType) {
        const renderData = this._renderData;
        if (this.dataOffset > renderData.dataLength - 4) {
            this.dataOffset = 0;
        }
        const dataOffset = this.dataOffset;
        this.updateRenderData(dataOffset, d);
        this.updateRenderDataColor(dataOffset, d.colors, d.colors2);
        this.dataOffset += 4;
        renderData.vertDirty = true;
    }

    /**
     * 添加顶点数据，此方法会改变顶点数据长度，请先调用resetRenderData方法重置顶点数据
     * @param d
     * @param colors 颜色数组，如果不需要设置颜色，请传入null，否则传入颜色数组，数组长度最大为4，即4个顶点对应4个颜色值。
     * @param colors2 颜色数组，如果不需要设置颜色，请传入null，否则传入颜色数组，数组长度最大为4，即4个顶点对应4个颜色值。
     */
    protected addRenderData(d: RenderDataType) {
        const renderData = this._renderData;
        renderData.dataLength += d.uv.length / 2;
        renderData.resize(renderData.dataLength, (renderData.dataLength - 2) * 3);
        this.setRenderData(d);
    }

    /**
     * 修改指定dataOffset的顶点数据，dataOffset从0开始，如果dataOffset大于等于当前顶点数据长度，则不修改任何数据
     * @param dataOffset 
     * @param d
     */
    protected updateRenderData(dataOffset: number, d: RenderDataType) {
        const renderData = this._renderData;
        if (dataOffset > renderData.dataLength - 4) return;
        const dataList = renderData.data;
        if (d.uv?.length > 0) {
            if (!d.rotated) {
                dataList[dataOffset].u = d.uv[0];
                dataList[dataOffset].v = d.uv[1];
                dataList[dataOffset + 1].u = d.uv[2];
                dataList[dataOffset + 1].v = d.uv[3];
                dataList[dataOffset + 2].u = d.uv[4];
                dataList[dataOffset + 2].v = d.uv[5];
                dataList[dataOffset + 3].u = d.uv[6];
                dataList[dataOffset + 3].v = d.uv[7];
            } else {
                dataList[dataOffset].u = d.uv[4];
                dataList[dataOffset].v = d.uv[5];
                dataList[dataOffset + 1].u = d.uv[0];
                dataList[dataOffset + 1].v = d.uv[1];
                dataList[dataOffset + 2].u = d.uv[6];
                dataList[dataOffset + 2].v = d.uv[7];
                dataList[dataOffset + 3].u = d.uv[2];
                dataList[dataOffset + 3].v = d.uv[3];
            }
        }
        if (d.xy?.length > 0) {
            for (let i = 0; i < 4; i++) {
                dataList[dataOffset + i].x = d.xy[i * 2];
                dataList[dataOffset + i].y = d.xy[i * 2 + 1];
            }
        }
    }

    /**
     * 更新顶点颜色数据
     * @param dataOffset 
     * @param colors 
     * @param colors2 
     */
    protected updateRenderDataColor(dataOffset: number, colors: Color[], colors2?: Color[]) {
        if (colors?.length > 0) {
            this.renderColors[dataOffset] = colors[0];
            this.renderColors[dataOffset + 1] = colors[1] || colors[0];
            this.renderColors[dataOffset + 2] = colors[2] || colors[0];
            this.renderColors[dataOffset + 3] = colors[3] || colors[1] || colors[0];
        }
        if (colors2?.length > 0) {
            this.renderColors2[dataOffset] = colors2[0];
            this.renderColors2[dataOffset + 1] = colors2[1] || colors2[0];
            this.renderColors2[dataOffset + 2] = colors2[2] || colors2[0];
            this.renderColors2[dataOffset + 3] = colors2[3] || colors2[1] || colors2[0];
        }
    }

    /**
     * 4个顶点在节点内的坐标
     * @param x 左上角x坐标
     * @param y 左上角y坐标
     * @param width 
     * @param height 
     * @returns 
     */
    protected getXY(x: number, y: number, width: number, height: number): number[] {
        return [x, y - height, x + width, y - height, x, y, x + width, y];
    }

    /**
     * 4个顶点的uv坐标
     * @param u 左上角u坐标[0,1]
     * @param v 左上角v坐标[0,1]
     * @param width [0,1]
     * @param height [0,1]
     * @returns 
     */
    protected getUV(u: number, v: number, width: number, height: number): number[] {
        return [u, v + height, u + width, v + height, u, v, u + width, v];
    }

    /**
     * 默认uv
     * @returns 
     */
    protected getDefaultUV(): number[] {
        return [0, 1, 1, 1, 0, 0, 1, 0];
    }

    /**
     * 默认4个顶点坐标
     * @returns 
     */
    protected getDefaultXY(): number[] {
        const { width, height } = no.size(this.node),
            { x, y } = no.anchor(this.node);
        return [-width * x, -height * y, width * (1 - x), -height * y, -width * x, height * (1 - y), width * (1 - x), height * (1 - y)];
    }

    protected onFlushAssembler() {

    }
}

const vec3_temp = new Vec3();
const _worldMatrix = new Mat4();
export const YJAssemblerBase = {
    createData(vertexFormat?: Attribute[]) {
        return RenderData.add(vertexFormat);
    },

    fillBuffers(comp: YJRenderBase, renderer: any) {
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

    updateRenderData(comp: YJRenderBase) {
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
    updateWorldVerts(comp: YJRenderBase) {
        const renderData = comp.renderData!;
        const dataList = renderData.data;
        const chunk = renderData.chunk;
        const vData = chunk.vb;
        const vertexCount = renderData.vertexCount;
        const floatStride = renderData.floatStride;

        comp.node.getWorldMatrix(_worldMatrix);

        let vertexOffset = 0;
        for (let i = 0; i < vertexCount; i++) {
            const vert = dataList[i];
            Vec3.set(vec3_temp, vert.x, vert.y, 0);
            Vec3.transformMat4(vec3_temp, vec3_temp, _worldMatrix);
            vData[vertexOffset] = vec3_temp.x;
            vData[vertexOffset + 1] = vec3_temp.y;
            vData[vertexOffset + 2] = vec3_temp.z;
            vertexOffset += floatStride;
        }
    },

    updateVertexData(comp: YJRenderBase) {

    },

    updateUVs(comp: YJRenderBase) {
        const renderData = comp.renderData!;
        const vData = renderData.chunk.vb;
        const vertexCount = renderData.vertexCount;
        const floatStride = renderData.floatStride;
        const dataList = renderData.data;

        let vertexOffset = 3;
        for (let i = 0; i < vertexCount; i++) {
            const vert = dataList[i];
            vData[vertexOffset] = vert.u;
            vData[vertexOffset + 1] = vert.v;
            vertexOffset += floatStride;
        }
    },

    updateIndexes(comp: YJRenderBase) {
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

    updateColor(comp: YJRenderBase) {
        const renderData = comp.renderData!;
        const vData = renderData.chunk.vb;
        const vertexCount = renderData.vertexCount;
        const floatStride = renderData.floatStride;
        let colorOffset = 5;
        for (let i = 0; i < vertexCount; i++) {
            //更新color
            const color: Color = comp.renderColors?.[i] || comp.color;
            Color.toArray(vData, color, colorOffset);

            //更新color2
            if (comp.renderColors2?.[i]) {
                Color.toArray(vData, comp.renderColors2[i], colorOffset + 4);
            }
            colorOffset += floatStride;
        }
    },
};

