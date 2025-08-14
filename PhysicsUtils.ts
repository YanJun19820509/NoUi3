/**
 * 物理计算工具
 */
export namespace physicsUtils {
    /**
     * 计算反射角
     * @param dir 入射角
     * @param angle 接触面角度
     * @returns 反射角
     */
    export function calculateReboundAngle(dir: number, angle: number) {
        let a = dir;
        if (a < 0) a += 180;
        else if (a > 180) a -= 180;
        a = 180 - a;//相对于水平面的反射角
        a += angle;//加上接触面角度
        return a;
    }
}