import { no } from "../no";
import { js } from "../yj";

/**
 * json 配置读取
 */
/**
 * JSON 配置数据库核心类
 * @remarks
 * - 使用特殊分隔符(ASCII 94即^)分割数据
 * - 支持按需加载指定表、ID和属性
 * - 自动处理数字类型转换
 * 
 * @example
 * // 数据库文件结构示例：
 * {
 *   "tables": {
 *     "users": {
 *       "ids": "1001^1002",
 *       "properties": "name^age",
 *       "offset": 0
 *     }
 *   },
 *   "data": "John^25^^Doe^30^"
 * }
 */
class Database {
    private tables: any;          // 表结构元数据 {表名: {ids, properties, offset}}
    private data: string[];       // 扁平化数据存储数组
    private tableNames: string[]; // 所有表名列表
    public name: string;          // 数据库名称
    public loaded: boolean = false; // 加载状态标记
    private cCode = 94;           // 数据分隔符ASCII码(^)

    constructor(file: any) {
        this.init(file);
    }

    /**
     * 初始化数据库结构
     * @param file 数据库文件对象
     * @example
     * // 输入文件结构：
     * {
     *   name: 'userDB',
     *   json: {
     *     tables: { /* 表结构 * / },
     *     data: "value1^value2^..."
     *   }
     * }
     */
    private init(file: any) {
        this.name = file.name;
        this.tables = {};
        this.tableNames = [];
        // 初始化数据并转换数字类型
        this.data = this.initData(file.json.data);
        // 解析表结构元数据
        for (const name in file.json.tables) {
            const a = file.json.tables[name];
            this.tables[name] = {
                ids: a.ids.split(String.fromCharCode(this.cCode)),      // 分割ID列表
                properties: a.properties.split(String.fromCharCode(this.cCode)), // 分割属性列表
                offset: a.offset // 数据起始偏移量
            };
            this.tableNames.push(name);
        }
        this.loaded = true;
    }

    /**
     * 获取所有表数据
     * @returns 包含所有表数据的对象 {表名: 表数据}
     */
    private allTablesData() {
        let d: any = {};
        for (let i = 0; i < this.tableNames.length; i++) {
            let tn = this.tableNames[i];
            d[tn] = this.read(tn);
        }
        return d;
    }

    /**
     * 初始化并转换原始数据
     * @param data 原始字符串数据
     * @returns 处理后的数据数组（自动转换数字类型）
     * @example
     * // 输入："12^hello^^3.14^"
     * // 输出：[12, "hello", "", 3.14]
     */
    private initData(data: string) {
        const arr: any[] = data.split(String.fromCharCode(this.cCode));
        let result = [];
        for (let i = 0, n = arr.length; i < n; i++) {
            let a = arr[i];
            // 自动转换数字类型，空值保持原样
            result[i] = a == '' || isNaN(a) ? a : Number(a);
        }
        return result;
    }

    /**
     * 读取配置数据
     * @param tableName 表名（不传则读取所有表）
     * @param exprotIds 需要读取的ID列表（不传则读取全部）
     * @param exportProperties 需要读取的属性列表（不传则读取全部）
     * @returns 根据参数返回不同结构的数据
     * 
     * @example
     * // 读取整个users表
     * db.read('users');
     * 
     * @example
     * // 读取users表1001号的name属性
     * db.read('users', ['1001'], ['name']); // 返回 "John"
     * 
     * @example
     * // 读取users表多个ID的多个属性
     * db.read('users', ['1001','1002'], ['name','age']); 
     * // 返回 {1001: {name:'John',age:25}, 1002: {name:'Doe',age:30}}
     */
    public read(tableName?: string, exprotIds?: string[], exportProperties?: string[]) {
        if (!tableName) return this.allTablesData();
        if (!this.tableNames.includes(tableName)) return null;

        const { ids, properties, offset } = this.tables[tableName];
        let data: any = {};

        // 遍历所有ID构建数据
        for (let i = 0, n = ids.length; i < n; i++) {
            const id = ids[i];
            if (!id) continue;
            if (exprotIds && !exprotIds.includes(id)) continue;

            let d: any = {};
            // 遍历属性填充数据
            for (let j = 0, m = properties.length; j < m; j++) {
                const p = properties[j];
                if (exportProperties && !exportProperties.includes(p)) continue;
                // 计算数据索引：起始偏移 + 行号*列数 + 列号
                d[p] = this.data[offset + i * m + j];
            }
            data[id] = d;
        }

        // 根据参数类型优化返回结构
        if (!exprotIds || exprotIds?.length > 1) return data;
        if (exportProperties?.length == 1) return data[exprotIds[0]]?.[exportProperties[0]];
        return data[exprotIds[0]];
    }
}
/**
 * JSON配置管理类
 * @remarks
 * - 提供多数据库的加载和管理能力
 * - 支持路径式查询和参数式查询两种访问方式
 * - 自动处理资源配置的加载和释放
 * 
 * @example
 * // 基本使用流程：
 * 1. 加载配置数据库 YJJsonConfig.loadDatabases(['config/items'])
 * 2. 读取配置数据 YJJsonConfig.read('items.weapons.1001.damage')
 */
class JsonConfig {
    // 数据库集合，key为数据库名称，value为数据库实例
    private database: Map<string, Database> = new Map<string, Database>();

    /**
     * 直接加载内存中的数据库配置
     * @param d 数据库配置对象
     * @example
     * loadDatabase({
     *   name: 'test_db',
     *   json: { tables: [...] }
     * });
     */
    public loadDatabase(d: { name: string, json: any }) {
        const database = new Database(d);
        this.database.set(database.name, database);
    }

    /**
     * 批量加载配置文件
     * @param files 需要加载的配置文件路径数组
     * @example
     * loadDatabases(['config/characters', 'config/skills']);
     */
    public loadDatabases(files: string[]) {
        for (let i = 0, n = files.length; i < n; i++) {
            this.loadFile(files[i]);
        }
    }

    /**
     * 异步加载单个配置文件
     * @param file 配置文件路径（不需要.json后缀）
     * @example
     * loadFile('config/items/weapons');
     */
    private loadFile(file: string) {
        no.assetBundleManager.loadJSON(file, item => {
            const database = new Database({ name: item.name, json: item.json });
            this.database.set(database.name, database);
            item.decRef(); // 减少资源引用计数
        });
    }

    /**
     * 路径式读取配置（重载1）
     * @param path 点分隔的路径字符串或路径数组，格式：
     * databaseName.tableName[.exprotIds(id1,id2,...)[.exportProperties(p1,p2,...)]]
     * @returns 根据路径深度返回不同结构的数据
     * 
     * @example
     * read('game_config.weapons'); // 读取整个武器表
     * read(['game_config', 'weapons', '1001,1002', 'damage,range']); // 读取多个武器的特定属性
     */
    public read(path: string | string[]): any;
    
    /**
     * 参数式读取配置（重载2）
     * @param databaseName 数据库名称
     * @param tableName 表名称
     * @param exprotIds 需要查询的ID列表（可选）
     * @param exportProperties 需要查询的属性列表（可选）
     * @returns 根据参数组合返回不同结构的数据
     * 
     * @example
     * read('game_data', 'monsters'); // 读取整个怪物表
     * read('game_data', 'items', ['potion_001']); // 读取指定ID的道具
     */
    public read(databaseName: string, tableName: string, exprotIds?: string[], exportProperties?: string[]): any;
    
    public read(databaseName: string | string[], tableName?: string, exprotIds?: string[], exportProperties?: string[]) {
        let dbn: string;
        if (!tableName) {
            // 处理路径式参数解析
            const paths = typeof databaseName == 'string' ? databaseName.split('.') : databaseName;
            dbn = paths[0];
            tableName = paths[1];
            exprotIds = paths[2] ? paths[2].split(',') : null;
            exportProperties = paths[3] ? paths[3].split(',') : null;
        } else {
            // 处理参数式调用
            dbn = databaseName as string;
        }
        
        const database = this.database.get(dbn);
        if (!database) return null;
        return database.read(tableName, exprotIds, exportProperties);
    }
}

export const YJJsonConfig = new JsonConfig();

js.mixin(no['DataCache'].prototype, {
    getJSON(path?: string | string[]): any {
        const a = YJJsonConfig.read(path);
        if (a === null || a === undefined) no.err('配置数据不存在：', path);
        return a;
    },
    setJSON(json: Object): void {
        for (const key in json) {
            YJJsonConfig.loadDatabase({ name: key, json: json[key] });
        }
    }
});