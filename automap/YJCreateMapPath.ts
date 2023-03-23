import { math } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { TileInfo, TilePos, TilePosEqual } from '../../MapEngine/component/CreateMapObjectBase';
import { PathInfo } from '../../MapEngine/component/CreatePath';
import { no } from '../no';
import { UV } from '../types';
import { YJCreateMapLandform } from './YJCreateMapLandform';
const { ccclass, property } = _decorator;

@ccclass('YJCreateMapPath')
export class YJCreateMapPath extends YJCreateMapLandform {

    private pathInfos: PathInfo[] = [];
    protected _dirTiles: { [k: string]: TileInfo };
    protected _validGridPos: TilePos[];
    protected tileDir: { [k: string]: string };
    protected obstacleContainer: YJCreateMapLandform;
    /**所有路线的点 */
    public allPathPoints: { [k: string]: TilePos[] };

    public setConfig(v: any) {
        super.setConfig(v);
        v.pathes?.forEach((p: any) => {
            this.pathInfos[this.pathInfos.length] = new PathInfo(p.start, p.end, p.turnNumRange);
        });
        if (v.obstacleContainer)
            this.obstacleContainer = no.getNodeInParents(this.node, v.obstacleContainer)?.getComponent(YJCreateMapLandform);
    }

    protected initDirTiles() {
        this._dirTiles = {};
        this.tileInfos.forEach(tileInfo => {
            const tile = tileInfo.tileConfig;
            if (tile.dirs)
                this._dirTiles[tile.dirs] = tileInfo;
        });
    }

    protected setValidGridPos() {
        this._validGridPos = [];
        let point = math.v2();
        this._gridpos.forEach(pos => {
            point.set(pos.x, pos.y);
            const isIn = this.checkInSpace(point);
            if (isIn != this.isEmpty) this._validGridPos[this._validGridPos.length] = pos;
        });
    }

    protected async pavePathes() {
        this.tileDir = {};
        this.allPathPoints = {};
        for (let i = 0, n = this.pathInfos.length; i < n; i++) {
            const info = this.pathInfos[i];
            await this.createPath(info);
            await no.sleep(0.05);
        }
    }

    private async createPath(pathInfo: PathInfo) {
        let turnPos = this.getTurnPoint(pathInfo.turnNum);
        turnPos = [].concat(this.getPos(pathInfo.start), turnPos, this.getPos(pathInfo.end));
        const pos = this.getAllPointsPath(turnPos);
        this.allPathPoints[pathInfo.uuid] = pos;
        for (let i = 0, n = pos.length; i < n; i++) {
            const p = pos[i], uv = `${p.u}-${p.v}`, dir = this.tileDir[uv], tileInfo = this._dirTiles[dir];
            // if (!tileInfo)
            no.log('createPath', uv, dir);
            this.createGrid(p, tileInfo);
            // await no.sleep(.1);
        }
    }

    private getTurnPoint(turnNum: number): TilePos[] {
        if (turnNum == 0) return [];
        let a = no.arrayRandom(this._validGridPos, turnNum, false);
        return [].concat(a);
    }

    private getTowPointPath(p1: TilePos, p2: TilePos, p0?: TilePos): TilePos[] {
        no.log(p1, p2);
        let curU = p1.u,
            curV = p1.v,
            uSteps = p2.u - p1.u,
            vSteps = p2.v - p1.v,
            allStep = Math.abs(uSteps) + Math.abs(vSteps),
            uSub = uSteps == 0 ? 0 : (uSteps > 0 ? 1 : -1),
            vSub = vSteps == 0 ? 0 : (vSteps > 0 ? 1 : -1),
            addStepU = uSteps == 0 ? false : (vSteps == 0 ? true : no.randomBetween(0, 10) <= 5),
            path: TilePos[] = [],
            obstaclePos: TilePos;
        if (this.obstacleContainer?.isUsed(p1)) {
            //遇到障碍
            const bypassPoint = this.getBypassObstaclePoint(p0, addStepU) || this.getBypassObstaclePoint(p1, addStepU);
            if (!bypassPoint) return path;
            no.log('bypassPoint1', bypassPoint);
            return this.getAllPointsPath([p0, bypassPoint, p2]);
        }
        path[0] = p1;
        while (allStep-- > 0) {
            let u = addStepU ? curU + uSub : curU,
                v = addStepU ? curV : curV + vSub,
                pos = this.getPos(u, v),
                lastPos = path[path.length - 1];
            if (TilePosEqual(pos, p2) && this.obstacleContainer?.isUsed(pos)) {
                this.checkDir(lastPos, path[path.length - 2] || p0, pos);
                break;
            }
            if (!pos) {
                addStepU = !addStepU;
                u = addStepU ? curU + uSub : curU;
                v = addStepU ? curV : curV + vSub;
                pos = this.getPos(u, v);
                if (!pos) break;
            }
            if (this.obstacleContainer?.isUsed(pos)) {
                //遇到障碍
                obstaclePos = lastPos;
                break;
            }
            this.checkDir(lastPos, path[path.length - 2] || p0, pos);
            path[path.length] = pos;
            curU = u;
            curV = v;
            if (addStepU) uSteps -= uSub;
            else vSteps -= vSub;
            if (uSteps == 0) addStepU = false;
            else if (vSteps == 0) addStepU = true;
        }
        if (obstaclePos) {//遇到障碍，寻找最近的绕过障碍的点，并重新计算路径
            no.log('obstaclePos', obstaclePos);
            const bypassPoint = this.getBypassObstaclePoint(obstaclePos, addStepU);
            this.checkDir(obstaclePos, path[path.length - 2] || p0, bypassPoint);
            if (!bypassPoint) return path;
            no.log('bypassPoint2', bypassPoint);
            let path1: TilePos[];
            if (path.length == 2) {
                path.length = 0;
                path1 = this.getTowPointPath(p1, bypassPoint, p0);
            } else
                path1 = this.getTowPointPath(path.pop(), bypassPoint, path[path.length - 1]);
            const path2 = this.getTowPointPath(path1.pop(), p2, path1[path1.length - 1]);
            return path.concat(path1, path2);
        }
        this.checkDir(p2, path[path.length - 2]);
        return path;
    }

    private getBypassObstaclePoint(obstaclePos: TilePos, isU: boolean): TilePos {
        if (!obstaclePos) return null;
        let uSub = isU ? 0 : 1, vSub = isU ? 1 : 0, try1 = 0, try2 = 0, pos1: TilePos, pos2: TilePos;
        while (true) {
            try1++;
            pos1 = this.getPos(obstaclePos.u + uSub * try1, obstaclePos.v + vSub * try1);
            if (!pos1 || !this.obstacleContainer?.isUsed(pos1)) break;
        }
        while (true) {
            try2++;
            pos2 = this.getPos(obstaclePos.u - uSub * try2, obstaclePos.v - vSub * try2);
            if (!pos2 || !this.obstacleContainer?.isUsed(pos2)) break;
        }
        if (!pos1 && !pos2) return null;
        if (!pos1 && pos2) return pos2;
        if (pos1 && !pos2) return pos1;
        if (try1 < try2) return pos1;
        if (try1 > try2) return pos2;
        return no.arrayRandom([pos1, pos2], 1);
    }

    private checkDir(curPos: TilePos, prePos?: TilePos, nextPos?: TilePos) {
        let oldDir: string = this.tileDir[`${curPos.u}-${curPos.v}`];
        let dir: string[] = oldDir?.split('') || [];
        let u: number, v: number;
        if (prePos) {
            u = prePos.u - curPos.u;
            v = prePos.v - curPos.v;
            no.addToArray(dir, this.getDir(u, v));
        }
        if (nextPos) {
            u = nextPos.u - curPos.u;
            v = nextPos.v - curPos.v;
            no.addToArray(dir, this.getDir(u, v));
        }
        if (dir.length == 1) {
            no.addToArray(dir, this.getDir(-u, -v));
        }
        dir.sort((a, b) => { return Number(a) - Number(b); });
        this.tileDir[`${curPos.u}-${curPos.v}`] = dir.join('');
    }

    private getDir(u: number, v: number): string {
        if (u != 0) return u > 0 ? '3' : '1';
        if (v != 0) return v > 0 ? '0' : '2';
    }

    private getAllPointsPath(points: TilePos[]): TilePos[] {
        let allPath: TilePos[] = [];
        for (let i = 0, n = points.length; i < n - 1; i++) {
            if (!points[i] || !points[i + 1]) continue;
            let path = this.getTowPointPath(points[i], points[i + 1], allPath[allPath.length - 2]);
            if (allPath.length > 0) path.shift();
            allPath = allPath.concat(path);
        }
        return allPath;
    }


    public async pave() {
        await this.tilePrefab.loadPrefab();
        this.initDirTiles();
        this.setValidGridPos();
        if (this.container.uuid == this.node.uuid)
            this.container.removeAllChildren();
        await this.pavePathes();
        this.container.children.sort((a, b) => {
            return b.position.y - a.position.y;
        });
    }

    private getPos(uv: UV): TilePos | null;
    private getPos(u: number, v: number): TilePos | null;
    private getPos(u: number | UV, v?: number): TilePos | null {
        let _u: number, _v: number;
        if (u instanceof UV) {
            _u = u.u;
            _v = u.v;
        } else {
            _u = u;
            _v = v;
        }
        for (let i = 0, n = this._gridpos.length; i < n; i++) {
            const pos = this._gridpos[i];
            if (pos.u == _u && pos.v == _v) return pos;
        }
        return null;
    }
}


