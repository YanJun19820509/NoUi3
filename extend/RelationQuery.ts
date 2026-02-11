/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 12:13:38 GMT+0800 (中国标准时间)
 *
 */

import { no } from "../no";

/** 
     * 关系查询引擎（支持多条件组合查询和嵌套查询）
     * @example
     * // 初始化查询引擎
     * const query = RelationQuery.new;
     * 
     * // 简单查询示例
     * query.select('userTable where id==1001', {userTable});
     * 
     * // 复杂嵌套查询示例
     * query.select('orderTable[userId,price] where createTime>="2024-01" and status in (1,3) or (productTable.category=="电子产品")', tables);
     */
export class RelationQuery {

    /** 条件表达式缓存（提升重复条件解析性能） */
    private expMap: Map<string, { k: string, symbol: string, v: any }>;
    /** 当前查询的表数据集 */
    private _tableDatas: any;

    /** 工厂方法创建新实例 */
    public static get new(): RelationQuery {
        return new RelationQuery();
    }

    /** 初始化条件解析缓存 */
    constructor() {
        this.expMap = new Map<string, { k: string, symbol: string, v: any }>();
    }

    /**
     * 单表查询（自动处理单条/多条结果）
     * @param expression 查询表达式
     *   格式：'表名[字段1,字段2] where 条件'
     *   条件支持：==, !=, >, <, >=, <=, ?= (包含), in (集合)
     *   示例：'userTable[id,name] where age>18 and dept in (技术部,市场部)'
     * @param tableDatas 表数据对象 {表名: 数据表}
     * @returns 查询结果（单条数据直接返回对象，多条返回数组）
     * 
     * @example
     * // 查询用户表中管理员用户
     * select('adminUsers where role=="admin"', {adminUsers: userData});
     * 
     * // 带字段筛选的查询
     * select('products[name,price] where stock>0', productTables);
     */
    public select(expression: string, tableDatas: any): any {
        let a = this.selectList(expression, tableDatas) || [];
        return a.length <= 1 ? a[0] : a;
    }

    /**
     * 执行查询并始终返回数组结果
     * @param expression 查询表达式
     * @param tableDatas 表数据集合
     * @returns 查询结果数组（即使只有单条结果）
     * 
     * @example
     * // 获取所有库存大于100的商品
     * selectList('products where stock>100', {products});
     * 
     * // 多条件组合查询
     * selectList('orders where status==1 and totalPrice>=500', {orders});
     */
    public selectList(expression: string, tableDatas: any): any[] {
        this._tableDatas = tableDatas;
        expression = this.parseBrackets(expression);
        let arr = [];
        let exps = expression.split(' where ');
        let table = exps[0].split('.');
        let tableData = tableDatas[table[0]];

        // 处理WHERE条件
        if (exps[1]) {
            let query = exps[1];
            let queryies = this.parseOr(query);
            no.forEach(tableData, (key, value) => {
                if (this.checkConditions(value, queryies))
                    arr.push(value);
                return false;
            });
        } else { // 无WHERE条件全表扫描
            no.forEach(tableData, (key, value) => {
                arr.push(value);
                return false;
            });
        }

        // 处理字段选择
        if (table[1] != null && arr.length >= 1) {
            let b = [];
            for (let i = 0; i < arr.length; i++) {
                b.push(this.getQueryValue(arr[i], table[1]));
            }
            return b;
        } else if (table[1] == null) {
            return arr;
        }
    }

    /** 从数据对象中提取指定字段（支持多字段选择） */
    private getQueryValue(tableData: any, keys: string): any {
        keys = keys.replace(new RegExp('\\[|\\]', 'g'), '');
        let a = keys.split(',');
        if (a.length == 1) return tableData[a[0]];
        let b: any = {};
        for (let i = 0; i < a.length; i++) {
            b[a[i]] = tableData[a[i]];
        }
        return b;
    }

    /** 解析OR逻辑条件组 */
    private parseOr(str: string): string[][] {
        let queryies: string[][] = [];
        let ands = str.split(' or ');
        for (let i = 0; i < ands.length; i++) {
            queryies.push(this.parseAnd(ands[i]));
        }
        return queryies;
    }

    /** 解析AND逻辑条件组 */
    private parseAnd(str: string): string[] {
        return str.split(' and ');
    }

    /** 处理括号嵌套查询（支持多层嵌套） */
    private parseBrackets(exp: string): string {
        if (!exp.includes('(') && !exp.includes(')')) return exp;
        let i1 = exp.indexOf('('),
            i2 = exp.lastIndexOf(')');
        let sub = exp.substring(i1 + 1, i2);
        let a = this.select(sub, this._tableDatas);
        return exp.replace(exp.substring(i1, i2 + 1), String(a));
    }

    /** OR条件判断（任一条件组满足即返回true） */
    private checkConditions(d: any, conditions: string[][]): boolean {
        if (conditions != null) {
            let n = conditions.length;
            for (let i = 0; i < n; i++) {
                let condition = conditions[i];
                if (this.check(d, condition)) return true;
            }
            return false;
        } else {
            return true;
        }
    }

    /** AND条件判断（所有条件必须同时满足） */
    private check(d: any, conditions: string[]): boolean {
        let n = conditions.length;
        for (let i = 0; i < n; i++) {
            let condition = conditions[i];
            let exp = this.condition2Express(condition);

            let b: boolean;
            switch (exp.symbol) {
                case '==':
                    b = d[exp.k] == exp.v;
                    break;
                case '!=':
                    b = d[exp.k] != exp.v;
                    break;
                case '>=':
                    b = d[exp.k] >= exp.v;
                    break;
                case '<=':
                    b = d[exp.k] <= exp.v;
                    break;
                case '>':
                    b = d[exp.k] > exp.v;
                    break;
                case '<':
                    b = d[exp.k] < exp.v;
                    break;
                case '?=':
                    b = (d[exp.k] as string).includes(exp.v);
                    break;
                case 'in':
                    b = (exp.v.split(',')).includes(d[exp.k]);
                    break;
            }
            if (!b) return false;
        }
        return true;
    }

    /** 将条件字符串解析为结构化对象（带缓存优化） */
    private condition2Express(condition: string): { k: string, symbol: string, v: any } {
        if (this.expMap.has(condition)) return this.expMap.get(condition);

        let r = { k: '', symbol: '', v: null };
        condition = condition.trim();
        // 解析各种比较运算符
        if (condition.includes('==')) {
            r.symbol = '==';
            let a = condition.split('==');
            r.k = a[0].trim();
            r.v = a[1].trim();
        } else if (condition.includes('!=')) {
            r.symbol = '!=';
            let a = condition.split('!=');
            r.k = a[0].trim();
            r.v = a[1].trim();
        } else if (condition.includes('>=')) {
            r.symbol = '>=';
            let a = condition.split('>=');
            r.k = a[0].trim();
            r.v = Number(a[1].trim());
        } else if (condition.includes('<=')) {
            r.symbol = '<=';
            let a = condition.split('<=');
            r.k = a[0].trim();
            r.v = Number(a[1].trim());
        } else if (condition.includes('>')) {
            r.symbol = '>';
            let a = condition.split('>');
            r.k = a[0].trim();
            r.v = Number(a[1].trim());
        } else if (condition.includes('<')) {
            r.symbol = '<';
            let a = condition.split('<');
            r.k = a[0].trim();
            r.v = Number(a[1].trim());
        } else if (condition.includes('?=')) { // 字符串包含判断
            r.symbol = '?=';
            let a = condition.split('?=');
            r.k = a[0].trim();
            r.v = a[1].trim();
        } else if (condition.includes('in')) { // 集合包含判断
            r.symbol = 'in';
            let a = condition.split('in');
            r.k = a[0].trim();
            r.v = a[1].trim();
        }
        this.expMap.set(condition, r);
        return r;
    }
}