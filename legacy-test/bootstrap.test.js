/*
 * Tests that the parse trees generated by nearley-lanauge-bootstrapped.ne
 * match those generated by the old scannerless-nearley.ne.
 */

const fs = require('fs');
const expect = require('expect');

const shared =  require('./_shared');
const { interpreter } = require('./_shared');
const compile = shared.compile;
const parse = shared.parse;

function read(filename) {
    return fs.readFileSync(filename, 'utf-8');
}

describe('bootstrapped lexer', () => {

    const lexer = compile(read("src/grammars/nearley.ne")).lexer;
    function lex(source) {
        return Array.from(lexer.reset(source)).map(tok => tok.type + " " + tok.value)
    }
    function lexTypes(source) {
        return Array.from(lexer.reset(source)).map(tok => tok.type)
    }


    it('lexes directives', () => {
      expect(lex('@builtin "quxx"')).toEqual([
          "@builtin @builtin",
          "ws  ",
          "string quxx",
      ])
      expect(lex("@lexer moo")).toEqual([
          "@ @",
          "word lexer",
          "ws  ",
          "word moo",
      ])
    })

    it('lexes a simple rule', () => {
      expect(lex("foo -> bar")).toEqual([
          "word foo",
          "ws  ",
          "arrow ->",
          "ws  ",
          "word bar",
      ])
    })

    it('lexes arrows', () => {
      expect(lex("->")).toEqual(["arrow ->"])
      expect(lex("=>")).toEqual(["arrow =>"])
      expect(lex("-=->")).toEqual(["arrow -=->"])
    })

    it('lexes js code', () => {
      expect(lexTypes("{% foo % %}")).toEqual(['js'])
      expect(lexTypes("{% function() %}")).toEqual(['js'])
      expect(lexTypes("{% %}")).toEqual(['js'])
      expect(lexTypes("{%%}")).toEqual(['js'])
    })

    it('lexes charclasses', () => {
      expect(lex(".")).toEqual([
        "charclass /./",
      ])
      expect(lex("[^a-z\\s]")).toEqual([
        "charclass /[^a-z\\s]/",
      ])
      expect(lex("foo->[^a-z\\s]")).toEqual([
        "word foo",
        "arrow ->",
        "charclass /[^a-z\\s]/",
      ])
    })

    it('rejects newline in charclass', () => {
      expect(() => lex("[foo\n]")).toThrow()
    })

    it('lexes macros', () => {
      expect(lex("foo[X, Y]")).toEqual([
        "word foo",
        "[ [",
        "word X",
        ", ,",
        "ws  ",
        "word Y",
        "] ]",
      ])
      expect(lex("foo[[0-9]]")).toEqual([
        "word foo",
        "[ [",
        "charclass /[0-9]/",
        "] ]",
      ])
    })

    it('lexes strings', () => {
      expect(lex(`"bar"`)).toEqual(['string bar'])
      expect(lex('"I\\"m\\\\"')).toEqual(["string I\"m\\"])
      expect(lex('"foo\\"b\\\\ar\\n"')).toEqual(['string foo"b\\ar\n'])
      expect(lex('"\\u1234"')).toEqual(['string \u1234'])
    })

    it('lexes strings non-greedily ', () => {
      expect(lexTypes('"foo" "bar"')).toEqual(["string", "ws", "string"])
    })

    it('lexes a rule', () => {
        expect(lex('Tp4 -> "(" _ Tp _ ")"')).toEqual([
          "word Tp4",
          "ws  ",
          "arrow ->",
          "ws  ",
          "string (",
          "ws  ",
          "word _",
          "ws  ",
          "word Tp",
          "ws  ",
          "word _",
          "ws  ",
          "string )",
        ])
    })

})

describe('bootstrapped parser', () => {

    const scannerless = interpreter(read("legacy-test/grammars/scannerless-nearley.ne"));
    const current = interpreter(read("src/grammars/nearley.ne"));

    const check = source =>  expect(current.run( source)).toEqual(scannerless.run(source))

    it('parses directives', () => {
        check("@lexer moo")
        check('@include "foo"')
        check('@builtin "bar"')
    })

    it('parses simple rules', () => {
        check('foo -> "waffle"')
        check("foo -> bar")
    })

    it('parses postprocessors', () => {
        check('foo -> "waffle" {% d => d[0] %}')
        check('foo -> "waffle" {%\nfunction(d) { return d[0]; }\n%}')
    })

    it('parses js code', () => {
        check("@{%\nconst moo = require('moo');\n%}")
    })

    it('parses options', () => {
        check("foo -> bar\n  | quxx")
    })

    it('parses tokens', () => {
        check("foo -> %foo")
    })

    it('parses strings', () => {
        check('foo -> "potato"')
        check('foo -> "("')
        //check("foo -> 'p'")
    })

    it('parses charclasses', () => {
        check('char -> .')
        check('y -> x:+\nx -> [a-z0-9] | "\\n"')
        check('m_key -> "any" {% id %} | [a-z0-9] {% id %}')
    })

    it('parses macro definitions', () => {
        check('foo[X] -> X')
        check('foo[X, Y] -> X')
    })

    it('parses macro use', () => {
        check('Y -> foo[Q]')
        check('Y -> foo[Q, P]')
        check('Y -> foo["string"]')
        check('Y -> foo[%tok]')
        check('Y -> foo[(baz quxx)]')
    })

    it('parses macro use', () => {
        check('Y -> foo[Q]')
        check('Y -> foo[Q, P]')
        check('Y -> foo["string"]')
        check('Y -> foo[%tok]')
        check('Y -> foo[(baz quxx)]')
    })

    it('parses a rule', () => {
        check('Tp4 -> "(" _ Tp _ ")"')
    })

})
