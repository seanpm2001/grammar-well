import { Grammar } from "./grammar";
import { Parser } from "./parser";
import { State } from "./state";
import { Dictionary } from "../typings";
import { LexerState } from "./lexer";


export class Column {
    lexerState: LexerState;
    states: State[] = [];
    wants: Dictionary<State[]> = Object.create(null);// states indexed by the non-terminal they expect
    scannable: State[] = [];// list of states that expect a token
    completed: Dictionary<State[]> = Object.create(null);  // states that are nullable

    constructor(
        private grammar: Grammar,
        public index: number
    ) { }


    process(nextColumn?) {
        let w = 0;
        let state: State;
        while (state = this.states[w++]) { // nb. we push() during iteration
            if (state.isComplete) {
                state.finish();
                if (state.data !== Parser.fail) {
                    const { wantedBy } = state;
                    for (var i = wantedBy.length; i--;) { // this line is hot
                        this.complete(wantedBy[i], state);
                    }

                    // special-case nullables
                    if (state.reference === this.index) {
                        const { name } = state.rule;
                        this.completed[name] = this.completed[name] || [];
                        this.completed[name].push(state);
                    }
                }

            } else {
                const exp = state.rule.symbols[state.dot];
                if (typeof exp !== 'string') {
                    this.scannable.push(state);
                    continue;
                }

                // predict
                if (this.wants[exp]) {
                    this.wants[exp].push(state);

                    if (this.completed[exp]) {
                        for (const right of this.completed[exp]) {
                            this.complete(state, right);
                        }
                    }
                } else {
                    this.wants[exp] = [state];
                    this.predict(exp);
                }
            }
        }
    }

    predict(exp: string) {
        if (!this.grammar.byName[exp])
            return;

        for (const rule of this.grammar.byName[exp]) {
            this.states.push(new State(rule, 0, this.index, this.wants[exp]));
        }
    }

    complete(left: State, right: State) {
        const copy = left.nextState(right);
        this.states.push(copy);
    }
}