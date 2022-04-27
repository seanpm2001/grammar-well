"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const column_1 = require("./column");
const grammar_1 = require("./grammar");
const lexer_1 = require("./lexer");
class Parser {
    constructor(a, b, c) {
        this.keepHistory = false;
        this.current = 0;
        let options;
        if (a instanceof grammar_1.Grammar) {
            this.grammar = a;
            options = b;
        }
        else {
            this.grammar = new grammar_1.Grammar(a, b);
            options = c;
        }
        this.keepHistory = !!(options === null || options === void 0 ? void 0 : options.keepHistory);
        this.lexer = (options === null || options === void 0 ? void 0 : options.lexer) || this.grammar.lexer || new lexer_1.StreamLexer();
        const column = new column_1.Column(this.grammar, 0);
        this.table = [column];
        column.wants[this.grammar.start] = [];
        column.predict(this.grammar.start);
        column.process();
    }
    next() {
        try {
            return this.lexer.next();
        }
        catch (e) {
            const nextColumn = new column_1.Column(this.grammar, this.current + 1);
            this.table.push(nextColumn);
            const err = new Error(this.reportLexerError(e));
            err.offset = this.current;
            err.token = e.token;
            throw err;
        }
    }
    feed(chunk) {
        this.lexer.reset(chunk, this.lexerState);
        let token, column;
        while (token = this.next()) {
            column = this.table[this.current];
            if (!this.keepHistory) {
                delete this.table[this.current - 1];
            }
            const n = this.current + 1;
            const nextColumn = new column_1.Column(this.grammar, n);
            this.table.push(nextColumn);
            const literal = token.text !== undefined ? token.text : token.value;
            const value = this.lexer.constructor === lexer_1.StreamLexer ? token.value : token;
            const { scannable } = column;
            for (let w = scannable.length; w--;) {
                const state = scannable[w];
                const expect = state.rule.symbols[state.dot];
                if (expect.test ? expect.test(value) :
                    expect.type ? expect.type === token.type
                        : expect.literal === literal) {
                    const next = state.nextState({ data: value, token: token, isToken: true, reference: n - 1 });
                    nextColumn.states.push(next);
                }
            }
            nextColumn.process();
            if (nextColumn.states.length === 0) {
                const err = new Error(this.reportError(token));
                err.offset = this.current;
                err.token = token;
                throw err;
            }
            if (this.keepHistory) {
                column.lexerState = this.lexer.save();
            }
            this.current++;
        }
        if (column) {
            this.lexerState = this.lexer.save();
        }
        this.results = this.finish();
    }
    ;
    reportLexerError(lexerError) {
        let tokenDisplay, lexerMessage;
        const token = lexerError.token;
        if (token) {
            tokenDisplay = "input " + JSON.stringify(token.text[0]) + " (lexer error)";
            lexerMessage = this.lexer.formatError(token, "Syntax error");
        }
        else {
            tokenDisplay = "input (lexer error)";
            lexerMessage = lexerError.message;
        }
        return this.reportErrorCommon(lexerMessage, tokenDisplay);
    }
    ;
    reportError(token) {
        const tokenDisplay = (token.type ? token.type + " token: " : "") + JSON.stringify(token.value !== undefined ? token.value : token);
        const lexerMessage = this.lexer.formatError(token, "Syntax error");
        return this.reportErrorCommon(lexerMessage, tokenDisplay);
    }
    ;
    reportErrorCommon(lexerMessage, tokenDisplay) {
        const lines = [];
        lines.push(lexerMessage);
        const lastColumnIndex = this.table.length - 2;
        const lastColumn = this.table[lastColumnIndex];
        const expectantStates = lastColumn.states
            .filter(function (state) {
            const nextSymbol = state.rule.symbols[state.dot];
            return nextSymbol && typeof nextSymbol !== "string";
        });
        if (expectantStates.length === 0) {
            lines.push('Unexpected ' + tokenDisplay + '. I did not expect any more input. Here is the state of my parse table:\n');
            this.displayStateStack(lastColumn.states, lines);
        }
        else {
            lines.push('Unexpected ' + tokenDisplay + '. Instead, I was expecting to see one of the following:\n');
            const stateStacks = expectantStates.map(state => this.buildFirstStateStack(state, new Set()) || [state]);
            stateStacks.forEach(function (stateStack) {
                const state = stateStack[0];
                const nextSymbol = state.rule.symbols[state.dot];
                const symbolDisplay = this.getSymbolDisplay(nextSymbol);
                lines.push('A ' + symbolDisplay + ' based on:');
                this.displayStateStack(stateStack, lines);
            }, this);
        }
        lines.push("");
        return lines.join("\n");
    }
    displayStateStack(stateStack, lines) {
        let lastDisplay;
        let sameDisplayCount = 0;
        for (let j = 0; j < stateStack.length; j++) {
            const state = stateStack[j];
            const display = state.rule.toString(state.dot);
            if (display === lastDisplay) {
                sameDisplayCount++;
            }
            else {
                if (sameDisplayCount > 0) {
                    lines.push('    ^ ' + sameDisplayCount + ' more lines identical to this');
                }
                sameDisplayCount = 0;
                lines.push('    ' + display);
            }
            lastDisplay = display;
        }
    }
    ;
    getSymbolDisplay(symbol) {
        const type = typeof symbol;
        if (type === "string") {
            return symbol;
        }
        else if (type === "object") {
            if (symbol.literal) {
                return JSON.stringify(symbol.literal);
            }
            else if (symbol instanceof RegExp) {
                return 'character matching ' + symbol;
            }
            else if (symbol.type) {
                return symbol.type + ' token';
            }
            else if (symbol.test) {
                return 'token matching ' + String(symbol.test);
            }
            else {
                throw new Error('Unknown symbol type: ' + symbol);
            }
        }
    }
    ;
    buildFirstStateStack(state, visited) {
        if (visited.has(state)) {
            return null;
        }
        if (state.wantedBy.length === 0) {
            return [state];
        }
        const prevState = state.wantedBy[0];
        const childVisited = new Set(visited);
        childVisited.add(state);
        const childResult = this.buildFirstStateStack(prevState, childVisited);
        if (childResult === null) {
            return null;
        }
        return [state].concat(childResult);
    }
    ;
    save() {
        const column = this.table[this.current];
        column.lexerState = this.lexerState;
        return column;
    }
    ;
    restore(column) {
        const index = column.index;
        this.current = index;
        this.table[index] = column;
        this.table.splice(index + 1);
        this.lexerState = column.lexerState;
        this.results = this.finish();
    }
    ;
    rewind(index) {
        if (!this.keepHistory) {
            throw new Error('set option `keepHistory` to enable rewinding');
        }
        this.restore(this.table[index]);
    }
    ;
    finish() {
        const considerations = [];
        const { start } = this.grammar;
        const { states } = this.table[this.table.length - 1];
        for (const { rule: { name, symbols }, dot, reference, data } of states) {
            if (name === start && dot === symbols.length && !reference && data !== Parser.fail) {
                considerations.push(data);
            }
        }
        return considerations;
    }
    ;
}
exports.Parser = Parser;
Parser.fail = Symbol();
//# sourceMappingURL=parser.js.map