// import { no } from "@hackUi/no";
import { mathUtils } from "./mathUtils";
import { stringUtils } from "./stringUtils";
import { sysTime } from "./sysTime";

export namespace dateUtils {
    /**
     * 获取某月的总天数
     * @param year 年份
     * @param month 月份（0-11，0表示1月，11表示12月）
     * @returns 该月的总天数
     */
    export function getDayCountOfMonth(year: number, month: number) {
        let t = new Date();
        t.setFullYear(year);
        t.setDate(1);   // 先设为 1 号，避免当前是 31 号时 setMonth 导致日期进位到下一月
        t.setMonth(month + 1);  // 下个月
        t.setDate(0);   // 0 号 = 本月最后一天
        t.setHours(0, 0, 0, 0);
        let date = t.getDate();
        t = null;
        return date;
    }

    /**
     * 获取两个日期之间的天数
     * @param start 开始日期
     * @param end 结束日期
     * @returns 两个日期之间的天数
     */
    export function getDayCountBetween(start: { year: number, month: number, date: number }, end: { year: number, month: number, date: number }) {
        let t = new Date();
        t.setFullYear(start.year);
        t.setDate(1);
        t.setMonth(start.month);
        t.setDate(start.date);
        t.setHours(0, 0, 0, 0);
        const startTimestamp = t.getTime();
        t.setDate(1);
        t.setFullYear(end.year);
        t.setMonth(end.month);
        t.setDate(end.date);
        const endTimestamp = t.getTime();
        const base = 86400000;
        return Math.floor((endTimestamp - startTimestamp) / base);
    }


    /**
     * 将UTC时区时间戳转化为本地系统所在时区时间戳
     * @param utcSeconds UTC时间戳（秒）
     * @returns 本地时区时间戳（秒）
     * @example
     * // 将UTC时间转换为北京时间
     * const utcTime = 1620000000; // 2021-05-03T00:00:00Z
     * const localTime = no.localDateSeconds(utcTime); // 返回1620028800（北京时间2021-05-03T08:00:00+08:00）
     * 
     * // 处理跨时区应用场景
     * const serverUTC = 1672531200; // 服务器UTC时间
     * const clientLocal = no.localDateSeconds(serverUTC); // 根据客户端时区转换
     */
    export function localDateSeconds(utcSeconds: number): number {
        const t = new Date(utcSeconds * 1000);
        t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
        return Math.floor(t.getTime() * .001);
    }

    /**
     * 获取当前时区时间（秒级，基于本地时区）
     * @returns 当前时区时间戳（秒）
     * @example
     * // 显示本地时间
     * const localSeconds = sysTime.locationTimeZoneNow;
     * console.log(`当前本地时间：${new Date(localSeconds * 1000)}`);
     */
    export function locationTimeZoneNow(): number {
        return localDateSeconds(sysTime.now);
    }

    const _parseSecondsCache: { d: number, h: number, M: number, s: number } = { d: 0, h: 0, M: 0, s: 0 };
    /**
     * 将秒数解析为日时分秒
     * @param v 总秒数
     * @returns 包含天(d)、小时(h)、分钟(M)、秒(s)的对象
     * @example
     * // 计算在线时长
     * no.parseSeconds(86461); // {d:1, h:1, M:1, s:1}
     * 
     * // 显示任务剩余时间
     * const {d, h} = no.parseSeconds(93200);
     * console.log(`剩余${d}天${h}小时`);
     */
    export function parseSeconds(v: number): { d: number, h: number, M: number, s: number } {
        _parseSecondsCache.d = mathUtils.floor(v / 86400);
        _parseSecondsCache.h = mathUtils.floor(v / 3600) % 24;
        _parseSecondsCache.M = mathUtils.floor((v % 3600) / 60);
        _parseSecondsCache.s = v % 60;
        return _parseSecondsCache;
    }

    const _parseTimestampCache: { y: number, m: number, d: number, h: number, M: number, s: number } = { y: 0, m: 0, d: 0, h: 0, M: 0, s: 0 };
    /**
     * 将时间戳解析为年月日时分秒
     * @param v 时间戳总秒数
     * @returns 包含年(y)、月(m)、日(d)、时(h)、分(M)、秒(s)的对象
     * @example
     * // 解析活动开始时间
     * no.parseTimestamp(1696141845); // {y:2023, m:10, d:1, h:12, M:30, s:45}
     * 
     * // 格式化生日时间
     * const {y, m, d} = no.parseTimestamp(947606400);
     * console.log(`生日：${y}年${m}月${d}日`); // 生日：2000年1月1日
     */
    export function parseTimestamp(v: number): { y: number, m: number, d: number, h: number, M: number, s: number } {
        let t = new Date(v * 1000);
        _parseTimestampCache.y = t.getFullYear();
        _parseTimestampCache.m = t.getMonth() + 1;
        _parseTimestampCache.d = t.getDate();
        _parseTimestampCache.h = t.getHours();
        _parseTimestampCache.M = t.getMinutes();
        _parseTimestampCache.s = t.getSeconds();
        return _parseTimestampCache;
    }

    /**
     * 获取当前时间戳（秒）
     * @param v 时间偏移量（秒），默认0
     * @returns 当前时间戳（秒）加上偏移量
     * @example
     * // 获取当前时间
     * no.timestamp(); // 1696141845
     * 
     * // 计算1小时后时间
     * const oneHourLater = no.timestamp(3600);
     */
    export function timestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        return mathUtils.floor(a.getTime() / 1000) + v;
    }

    /**
     * 获取当前时间戳（毫秒）
     * @param v 时间偏移量（毫秒），默认0
     * @returns 当前时间戳（毫秒）加上偏移量
     * @example
     * // 精确计时
     * const start = no.timestampMs();
     * // ...执行操作
     * const cost = no.timestampMs() - start;
     * 
     * // 设置30分钟后过期
     * const expireTime = no.timestampMs(1800000);
     */
    export function timestampMs(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        return a.getTime() + v;
    }

    /**
     * 获取当前/指定偏移的零点时间戳（秒）
     * @param v 时间偏移量（秒）默认0
     * @param isUTC 是否使用UTC时间 默认false（使用本地时区）
     * @returns 零点时间戳（秒） + 偏移量
     * @example
     * // 获取今日零点
     * no.zeroTimestamp(); // 1696141800
     * // 获取UTC零点
     * no.zeroTimestamp(0, true); 
     * // 获取明日此时时间戳
     * no.zeroTimestamp(86400);
     */
    export function zeroTimestamp(v = 0, isUTC = false): number {
        let a = new Date(sysTime.now * 1000);
        if (isUTC) {
            a.setUTCHours(0, 0, 0, 0);
        } else {
            a.setHours(0, 0, 0, 0);
        }
        return mathUtils.floor(a.getTime() / 1000) + v;
    }

    /**
     * 获取本周一零点时间戳（秒）
     * @param v 时间偏移量（秒）默认0
     * @returns 本周一零点时间戳 + 偏移量
     * @example
     * // 获取本周一零点
     * no.mondayZeroTimestamp(); 
     * // 计算本周活动结束时间（下周一零点前10秒）
     * no.nextMondayZeroTimestamp(-10);
     */
    export function mondayZeroTimestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        a.setHours(0, 0, 0, 0);
        a.setDate(a.getDate() - (a.getDay() || 7) + 1);
        return mathUtils.floor(a.getTime() / 1000) + v;
    }

    /**
     * 获取下周一零点时间戳（秒）
     * @param v 时间偏移量（秒）默认0
     * @returns 下周一零点时间戳 + 偏移量
     * @example
     * // 获取下周一起始时间
     * no.nextMondayZeroTimestamp();
     * // 计算周常任务剩余时间
     * const remain = no.nextMondayZeroTimestamp() - Date.now()/1000;
     */
    export function nextMondayZeroTimestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        a.setHours(0, 0, 0, 0);
        a.setDate(a.getDate() - (a.getDay() || 7) + 8);
        return mathUtils.floor(a.getTime() / 1000) + v;
    }

    /**
     * 获取本月1号零点时间戳（秒）
     * @param v 时间偏移量（秒）默认0
     * @returns 当月首日零点时间戳 + 偏移量
     * @example
     * // 获取本月起始时间
     * no.date1ZeroTimestamp();
     * // 计算月度统计时长
     * const monthDuration = Date.now()/1000 - no.date1ZeroTimestamp();
     */
    export function date1ZeroTimestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        a.setHours(0, 0, 0, 0);
        a.setDate(1);
        return mathUtils.floor(a.getTime() / 1000) + v;
    }

    /**
     * 获取下月1号零点时间戳（秒）
     * @param v 时间偏移量（秒）默认0
     * @returns 下月首日零点时间戳 + 偏移量
     * @example
     * // 获取下月起始时间
     * no.nextMonthDate1ZeroTimestamp();
     * // 计算订阅剩余时间
     * const remain = no.nextMonthDate1ZeroTimestamp() - Date.now()/1000;
     */
    export function nextMonthDate1ZeroTimestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        a.setHours(0, 0, 0, 0);
        a.setDate(1);
        a.setMonth(a.getMonth() + 1);
        return mathUtils.floor(a.getTime() / 1000) + v;
    }

    /**
     * 转换任意时间戳为当日零点时间戳（秒）
     * @param v 原始时间戳（秒）
     * @returns 对应日期的零点时间戳
     * @example
     * // 转换当前时间
     * no.toZeroTimestamp(Date.now()/1000);
     * // 处理日志时间
     * const logTime = 1696141845;
     * const logDate = no.toZeroTimestamp(logTime);
     */
    export function toZeroTimestamp(v: number): number {
        let a = new Date(v * 1000);
        a.setHours(0, 0, 0, 0);
        return mathUtils.floor(a.getTime() / 1000);
    }

    /**
     * 将秒数转换为本地化时间格式（时:分:秒）
     * @param time 时间长度（秒）
     * @returns 格式化的时间字符串（示例：3:15:45 表示3小时15分45秒）
     * @example
     * // 转换游戏在线时长
     * no.time2LocalFormat(3661); // 返回 "1:1:1"
     * // 显示任务耗时
     * const costTime = no.time2LocalFormat(145); // 返回 "0:2:25"
     */
    export function time2LocalFormat(time: number): string {
        let h: number, m: number, s: number;
        h = mathUtils.floor(time / 3600);
        m = mathUtils.floor((time % 3600) / 60);
        s = time % 60;
        return `${h}:${m}:${s}`;
    }

    /**
     * 将秒数转换为本地化的时分秒字符串（自动省略前导零）
     * @param seconds 时间长度（秒）
     * @returns 格式化的时间字符串（优先显示最大时间单位）
     * @example
     * // 显示任务剩余时间
     * no.second2LocalString(3661); // 返回 "1小时"
     * no.second2LocalString(61);   // 返回 "1分1秒"
     * no.second2LocalString(45);   // 返回 "45秒"
     * 
     * // 处理成就时间显示
     * const playTime = 3599;
     * document.getElementById('time').textContent = no.second2LocalString(playTime); // 显示 "59分59秒"
     */
    export function second2LocalString(seconds: number): string {
        let h: number, m: number, s: number;
        h = mathUtils.floor(seconds / 3600);
        m = mathUtils.floor((seconds % 3600) / 60);
        s = seconds % 60;
        let a = '';
        if (h > 0) a = `${h}`;
        if (m > 0) a = `${m}`;
        if (s > 0) a = `${s}`;
        return a;
    }

    /**
     * 秒数转格式化时间字符串（支持自定义格式和天数显示）
     * @param sec 时间长度（秒）
     * @param formatter 格式模板，支持 {d}天,{h}小时,{m}分,{s}秒
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的时间字符串
     * @example
     * // 基本用法
     * no.sec2time(3723); // 返回 "01:02:03"
     * 
     * // 自定义格式
     * no.sec2time(90061, '{d}天{h}时', false); // 返回 "1天1时"
     * 
     * // 显示倒计时
     * no.sec2time(3599, '{m}:{s}'); // 返回 "59:59"
     * 
     * // 处理负数
     * no.sec2time(-5); // 返回 "00:00:00"
     */
    export function sec2time(sec: number, formatter?: string, show0 = true) {
        formatter = formatter || '{h}:{m}:{s}';
        // 处理负数和零值
        if (sec <= 0) {
            let a = show0 ? '00' : '0';
            return stringUtils.formatString(formatter, { h: a, m: a, s: a });
        }
        let d = mathUtils.floor(sec / 86400);
        let h = mathUtils.floor(sec / 3600) % 24;
        // 自动切换天数显示
        if (d > 0) {
            formatter = `{d}d{h}h`;
            return stringUtils.formatString(formatter, { h: h, d: d });
        }

        let m: any = mathUtils.floor(sec / 60 % 60);
        let s: any = mathUtils.floor(sec % 60);

        // 前导零处理
        if (m <= 9 && show0) { m = `0${m}` }
        if (s <= 9 && show0) { s = `0${s}` }

        return stringUtils.formatString(formatter, { h: h, m: m, s: s });
    }

    /**
     * 内部方法 - 格式化纯时间部分（时/分/秒）
     * @param sec 时间戳（秒）
     * @param formatter 格式模板
     * @param show0 是否显示前导零
     * @returns 格式化后的时间字符串
     * @example
     * _formatSeconds(3615, '{h}小时{M}分', true) // 返回 "01小时00分"
     */
    function _formatSeconds(sec: number, formatter: string, show0: boolean): string {
        if (sec <= 0) {
            let a = show0 ? '00' : '0';
            return stringUtils.formatString(formatter, { h: a, M: a, s: a });
        }
        let h: any, m: any, s: any;
        h = mathUtils.floor(sec / 3600);
        m = mathUtils.floor((sec % 3600) / 60);
        s = sec % 60;
        if (m <= 9 && show0) { m = `0${m}`; }
        if (s <= 9 && show0) { s = `0${s}`; }
        return stringUtils.formatString(formatter, { h: h, M: m, s: s });
    }

    /**
     * 内部方法 - 格式化完整时间（年/月/日/时/分/秒）
     * @param sec 时间戳（秒）
     * @param formatter 格式模板
     * @param show0 是否显示前导零
     * @returns 格式化后的日期时间字符串
     * @example
     * _formatTime(1654321000, '{y}-{m}-{d}', true) // 返回 "2022-06-04"
     */
    function _formatTime(sec: number, formatter: string, show0: boolean): string {
        if (sec <= 0) return '';
        let { y, m, d, h, M, s }: { y: number, m: any, d: any, h: any, M: any, s: any } = parseTimestamp(sec);
        if (m <= 9 && show0) { m = `0${m}`; }
        if (d <= 9 && show0) { d = `0${d}`; }
        if (h <= 9 && show0) { h = `0${h}`; }
        if (M <= 9 && show0) { M = `0${M}`; }
        if (s <= 9 && show0) { s = `0${s}`; }
        return stringUtils.formatString(formatter, { y: y, m: m, d: d, h: h, M: M, s: s });
    }

    /**
     * 格式化时间为年月日时分秒（格式：年.月.日 时:分:秒）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的时间字符串
     * @example
     * formatTime_yymmddhhMMss(1654321000) // "2022.06.04 12:36:40"
     * formatTime_yymmddhhMMss(0, false)   // "0.0.0 0:0:0"
     */
    export function formatTime_yymmddhhMMss(sec: number, show0 = true): string {
        return _formatTime(sec, '{y}.{m}.{d} {h}:{M}:{s}', show0);
    }

    /**
     * 格式化时间为年月日（格式：年.月.日）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的日期字符串
     * @example
     * formatTime_yymmdd(1654321000)    // "2022.06.04"
     * formatTime_yymmdd(1696141845)    // "2023.10.01"
     */
    export function formatTime_yymmdd(sec: number, show0 = true): string {
        return _formatTime(sec, '{y}.{m}.{d}', show0);
    }

    /**
     * 格式化时间为时分秒（格式：时:分:秒）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的时间字符串
     * @example
     * formatTime_hhMMss(3661)         // "01:01:01"
     * formatTime_hhMMss(45296, false) // "12:34:56"
     */
    export function formatTime_hhMMss(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{h}:{M}:{s}', show0);
    }

    /**
     * 格式化时间为时分（格式：时:分）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的时间字符串
     * @example
     * formatTime_hhMM(3661)       // "01:01"
     * formatTime_hhMM(45296)      // "12:34"
     */
    export function formatTime_hhMM(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{h}:{M}', show0);
    }

    /**
     * 格式化时间为小时数（格式：时）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的小时字符串
     * @example
     * formatTime_hh(3600)     // "01"
     * formatTime_hh(7200, false) // "2"
     */
    export function formatTime_hh(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{h}', show0);
    }

    /**
     * 格式化时间为分秒（格式：分:秒）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的时间字符串
     * @example
     * formatTime_MMss(65)     // "01:05"
     * formatTime_MMss(125)    // "02:05"
     */
    export function formatTime_MMss(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{M}:{s}', show0);
    }

    /**
     * 格式化时间为秒数（格式：秒）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的秒数字符串
     * @example
     * formatTime_ss(45)       // "45"
     * formatTime_ss(5)        // "05"（当show0为true时）
     */
    export function formatTime_ss(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{s}', show0);
    }

    /**
     * 通用时间格式化方法
     * @param sec 时间戳（秒）
     * @param fmt 格式类型：yymmddhhMMss | yymmdd | hhMMss | hhMM | hh | MMss | ss
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的时间字符串
     * @example
     * formatTime(1654321000, 'yymmdd') // "2022.06.04"
     * formatTime(45296, 'hhMM')        // "12:34"
     * formatTime(125, 'MMss', false)   // "2:5"
     */
    export function formatTime(sec: number, fmt: 'yymmddhhMMss' | 'yymmdd' | 'hhMMss' | 'hhMM' | 'hh' | 'MMss' | 'ss', show0 = true): string {
        switch (fmt) {
            case 'yymmddhhMMss': return formatTime_yymmddhhMMss(sec, show0);
            case 'yymmdd': return formatTime_yymmdd(sec, show0);
            case 'hhMMss': return formatTime_hhMMss(sec, show0);
            case 'hhMM': return formatTime_hhMM(sec, show0);
            case 'hh': return formatTime_hh(sec, show0);
            case 'MMss': return formatTime_MMss(sec, show0);
            case 'ss': return formatTime_ss(sec, show0);
        }
    }
}