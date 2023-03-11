"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unflatten = exports.Flatten = exports.Matrix = exports.SymbolCollection = exports.Collection = void 0;
class Collection {
    categorized = {};
    uncategorized = new Map();
    items = [];
    constructor(ref = []) {
        for (const s of ref) {
            this.encode(s);
        }
    }
    encode(ref) {
        const c = this.resolve(ref);
        if (c)
            return this.addCategorized(c.category, c.key, ref);
        return this.addUncategorized(ref);
    }
    decode(id) {
        return this.items[typeof id == 'string' ? parseInt(id) : id];
    }
    has(ref) {
        const c = this.resolve(ref);
        if (c)
            return (c.key in this.categorized[c.category]);
        return this.uncategorized.has(ref);
    }
    redirect(source, target) {
        this.items[this.encode(source)] = target;
    }
    resolve(_) { }
    addCategorized(category, key, ref) {
        if (!(key in this.categorized[category])) {
            this.categorized[category][key] = this.items.length;
            this.items.push(ref);
        }
        return this.categorized[category][key];
    }
    addUncategorized(ref) {
        if (!this.uncategorized.has(ref)) {
            this.uncategorized.set(ref, this.items.length);
            this.items.push(ref);
        }
        return this.uncategorized.get(ref);
    }
}
exports.Collection = Collection;
class SymbolCollection extends Collection {
    categorized = {
        nonTerminal: {},
        literalI: {},
        literalS: {},
        token: {},
        regex: {},
        function: {},
    };
    resolve(symbol) {
        if (typeof symbol == 'string') {
            return { category: 'nonTerminal', key: symbol };
        }
        else if ('literal' in symbol) {
            if (symbol.insensitive)
                return { category: 'literalI', key: symbol.literal };
            return { category: 'literalS', key: symbol.literal };
        }
        else if ('token' in symbol) {
            return { category: 'token', key: symbol.token };
        }
        else if (symbol instanceof RegExp) {
            return { category: 'regex', key: symbol.toString() };
        }
        else if (typeof symbol == 'function') {
            return { category: 'function', key: symbol.toString() };
        }
    }
}
exports.SymbolCollection = SymbolCollection;
class Matrix {
    initial;
    $x = 0;
    $y = 0;
    get x() { return this.$x; }
    set x(x) { x != this.$x && this.resize(x, this.y); }
    get y() { return this.$y; }
    set y(y) { y != this.$y && this.resize(this.x, y); }
    matrix = [];
    constructor(x, y, initial) {
        this.initial = initial;
        this.resize(x, y);
    }
    get(x, y) {
        return this.matrix[x][y];
    }
    set(x, y, value) {
        return this.matrix[x][y] = value;
    }
    resize(x, y) {
        if (x < this.x) {
            this.matrix.splice(x);
            this.$x = x;
        }
        if (y > this.y) {
            this.matrix.forEach(a => a.push(...Matrix.Array(y - a.length, this.initial)));
            this.$y = y;
        }
        else if (y < this.y) {
            this.matrix.forEach(a => a.splice(y + 1));
            this.$y = y;
        }
        if (x > this.x) {
            const ext = Matrix.Array(x - this.x, () => Matrix.Array(this.y, this.initial));
            this.matrix.push(...ext);
            this.$x = x;
        }
    }
    static Array(length, initial) {
        return Array.from({ length }, (typeof initial == 'function' ? initial : () => initial));
    }
}
exports.Matrix = Matrix;
function Flatten(obj) {
    const collection = new Collection();
    function Traverse(ref) {
        if (collection.has(ref)) {
            return collection.encode(ref);
        }
        if (Array.isArray(ref)) {
            collection.redirect(ref, ref.map(v => Traverse(v)));
        }
        else if (typeof ref === 'object') {
            const o = {};
            for (const k in ref) {
                o[k] = Traverse(ref[k]);
            }
            collection.redirect(ref, o);
        }
        else if (typeof ref === 'function') {
            return collection.encode(ref.toString());
        }
        return collection.encode(ref);
    }
    Traverse(obj);
    return collection.items;
}
exports.Flatten = Flatten;
function Unflatten(items) {
    const visited = new Set();
    function Traverse(id) {
        if (visited.has(id)) {
            return items[id];
        }
        visited.add(id);
        if (Array.isArray(items[id])) {
            return items[id].map(v => Traverse(id));
        }
        else if (typeof items[id] === 'object') {
            for (const k in items[id]) {
                items[id][k] = Traverse(id[k]);
            }
        }
        return items[id];
    }
    return Traverse(0);
}
exports.Unflatten = Unflatten;
//# sourceMappingURL=general.js.map