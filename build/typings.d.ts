export declare type PostTransform = (payload: PostTransformPayload) => any;
interface PostTransformPayload {
    data: any[];
    reference: number;
    dot: number;
    name: string;
    reject: Symbol;
}
export declare type BuiltInPostProcessor = {
    builtin: string;
};
export interface Dictionary<T> {
    [key: string]: T;
}
export declare type PostProcessorResult = ExpressionDefinition | IncludeDefinition | ConfigDefinition | JavascriptDefinition | MacroDefinition | TokenLiteral | SubExpression | LexerToken | EBNFModified | MixIn | null;
export interface MacroDefinition {
    macro: string;
    args: string[];
    exprs: Expression[];
}
export declare type JavascriptDefinition = {
    body: string;
} | {
    head: string;
};
export interface ConfigDefinition {
    config: string;
    value: string;
}
export interface IncludeDefinition {
    include: string;
    builtin?: boolean;
}
export interface ExpressionDefinition {
    name: string;
    rules: Expression[];
}
export interface Expression {
    tokens: ExpressionToken[];
    postprocess?: string | BuiltInPostProcessor;
    transform?: string;
}
export declare type ExpressionToken = string | MixIn | MacroCall | SubExpression | LexerToken | EBNFModified | TokenLiteral;
export interface MacroCall {
    macrocall: string;
    args: ExpressionToken[];
}
export interface LexerToken {
    token: string;
}
export interface MixIn {
    mixin: string;
}
export interface EBNFModified {
    ebnf: ExpressionToken;
    modifier: ":+" | ":*" | ":?";
}
export interface TokenLiteral {
    literal: string;
}
export interface SubExpression {
    subexpression: Expression[];
}
export interface ProductionRule {
    body: any;
    builtin: any;
    include: any;
    macro: any;
    args: any;
    exprs: any;
    config: any;
    value: any;
    rules: any;
    name: any;
}
export declare type RuleDefinition = (JavascriptDefinition | IncludeDefinition | MacroDefinition | ConfigDefinition | ExpressionDefinition);
export declare type RuleDefinitionList = (JavascriptDefinition | IncludeDefinition | MacroDefinition | ConfigDefinition | ExpressionDefinition)[];
export declare type RuleSymbol = string | RegExp | RuleSymbolToken | RuleSymbolLexerToken | LexerToken | RuleSymbolTestable;
interface RuleSymbolToken {
    literal: any;
}
interface RuleSymbolTestable {
    test: (data: any) => boolean;
}
interface RuleSymbolLexerToken {
    type: string;
    value: string;
    text: string;
}
export interface GrammarBuilderRule {
    name: string;
    symbols: RuleSymbol[];
    postprocess?: BuiltInPostProcessor | string;
    transform?: BuiltInPostProcessor | string;
}
export interface Rule {
    name: string;
    symbols: RuleSymbol[];
    transform?: PostTransform;
}
export interface ParserAlgorithm {
    results: any[];
    feed(path: string): void;
}
export interface ParserConstructor {
    new (grammar: PrecompiledGrammar, options?: any): ParserAlgorithm;
}
export interface PrecompiledGrammar {
    lexer?: Lexer;
    start: string;
    rules: Rule[];
    map?: {
        [key: string]: Rule[];
    };
}
export interface Lexer {
    readonly line?: number;
    readonly column?: number;
    readonly index: number;
    readonly current: any;
    readonly state: LexerState;
    feed(chunk: string, flush?: boolean): void;
    flush(): void;
    reset(chunk?: string): void;
    restore(state: LexerState): void;
    next(): any;
    previous(): any;
    peek(offset: number): any;
}
export interface LexerState {
    index: number;
    indexOffset: number;
    line?: number;
    lineOffset?: number;
    column?: number;
}
export interface LexerHistory {
    token: any;
    state: LexerState;
}
export {};
