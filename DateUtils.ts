export namespace DateUtils {
    let _dateInstance: Date = new Date();
    /**
     * 获取某月的总天数
     * @param year 年份
     * @param month 月份（0-11，0表示1月，11表示12月）
     * @param dateInstance 日期实例
     * @returns 该月的总天数
     */
    export function getDayCountOfMonth(year: number, month: number, dateInstance?: Date) {
        const t = dateInstance || _dateInstance;
        // 设置下个月的第0天，即为本月的最后一天
        t.setFullYear(year);
        t.setMonth(month + 1);
        t.setDate(0);
        t.setHours(0, 0, 0, 0);
        return t.getDate();
    }

    /**
     * 获取两个日期之间的天数
     * @param start 开始日期
     * @param end 结束日期
     * @returns 两个日期之间的天数
     */
    export function getDayCountBetween(start: { year: number, month: number, date: number }, end: { year: number, month: number, date: number }) {
        _dateInstance.setFullYear(start.year);
        _dateInstance.setMonth(start.month);
        _dateInstance.setDate(start.date);
        _dateInstance.setHours(0, 0, 0, 0);
        const startTimestamp = _dateInstance.getTime();
        _dateInstance.setFullYear(end.year);
        _dateInstance.setMonth(end.month);
        _dateInstance.setDate(end.date);
        const endTimestamp = _dateInstance.getTime();
        const base = 86400000;
        return Math.floor((endTimestamp - startTimestamp) / base);
    }
}