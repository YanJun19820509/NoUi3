export namespace DateUtils {
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
}