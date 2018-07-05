'use strict';

const fs = require('fs');
const LanguageParser = require('./LanguageParser');
const lookupSymbol = require('./SymbolLocator').lookupSymbol;

const FIRST = 0;

const Node = function () {
    this.childNodes = [];
};
const ClassNode = function () {
    Node.call(this);
};

const PropNode = function () {
    Node.call(this);
    this.default = [];
};

const EnumNode = function () {
    Node.call(this);
};

const analyze = function (tokens) {
    const root = new Node();

    while (tokens.length > FIRST) {
        const cur = tokens.shift();

        let name,
            option,
            text;
        switch (cur.name) {
            case 'EOF':
                break;
            case 'preprocess':
                text = expect(tokens, 'string');

                if (cur.value === 'import') {
                    const buffer = fs.readFileSync(text.value, {encoding: 'ascii'});
                    const parentTokens = LanguageParser.tokenizeString(buffer);

                    const newRoot = analyze(parentTokens);

                    newRoot.childNodes.forEach(child => {
                        root.childNodes.push(child);
                    });
                }
                break;
            case 'identifier':
                switch (cur.value) {
                    case 'class': {
                        name = expect(tokens, 'identifier');
                        let identifier = null,
                            parent = null;

                        option = optional(tokens, 'operator', '<');
                        if (option) {
                            identifier = expect(tokens, 'identifier');
                            expect(tokens, 'operator', '>');
                        }

                        const expects = optional(tokens, 'identifier', 'expects');
                        if (expects) {
                            parent = expect(tokens, 'identifier');
                        }

                        const cnode = new ClassNode();
                        cnode.name = name.value;

                        if (identifier) {
                            cnode.identifier = lookupSymbol(root, identifier.value, false);
                        }

                        if (parent) {

                            // cnode.parent = lookupSymbol(root, parent.value, true);
                        }

                        root.childNodes.push(cnode);
                        parseInnerScope(tokens, cnode, root);
                    }
                        break;
                    case 'enum': {
                        name = expect(tokens, 'identifier');
                        let datatype = null;

                        option = optional(tokens, 'operator', '<');
                        if (option) {
                            datatype = expect(tokens, 'identifier');
                            expect(tokens, 'operator', '>');
                        }

                        const flag = optional(tokens, 'identifier', 'flags');

                        const enode = new EnumNode();
                        enode.name = name.value;

                        if (flag) {
                            enode.flags = flag.value;
                        }

                        if (datatype) {
                            enode.type = lookupSymbol(root, datatype.value, false);
                        }


                        root.childNodes.push(enode);
                        parseInnerScope(tokens, enode, root);
                    }
                        break;
                    default:
                }
                break;
            default:
        }
    }

    return root;
};

function parseInnerScope(tokens, parent, root) {
    expect(tokens, 'operator', '{');
    let scope2 = optional(tokens, 'operator', '}');

    while (!scope2) {
        const pnode = new PropNode();

        const t1 = tokens.shift();

        const t1op1 = optional(tokens, 'operator', '<');
        let flagOpt = null;

        if (t1op1) {
            flagOpt = expect(tokens, 'identifier');
            expect(tokens, 'operator', '>');

            pnode.flagsOpt = flagOpt.value;
        }

        const t2 = optional(tokens, 'identifier');
        const t3 = optional(tokens, 'identifier');

        if (t3) {
            pnode.name = t3.value;
            pnode.type = lookupSymbol(root, t2.value, false);
            pnode.flags = t1.value;
        } else if (t2) {
            pnode.name = t2.value;
            pnode.type = lookupSymbol(root, t1.value, false);
        } else {
            pnode.name = t1.value;
        }

        const defOp = optional(tokens, 'operator', '=');

        if (defOp) {
            let option = true;
            do {
                const value = tokens.shift();
                pnode.default.push(lookupSymbol(root, value.value, false));

                option = optional(tokens, 'operator', '|');
                if (!option) {
                    expect(tokens, 'terminator', ';');
                }
            } while (option);
        } else {
            expect(tokens, 'terminator', ';');
        }

        const obsolete = optional(tokens, 'identifier', 'obsolete');
        if (obsolete) {
            pnode.obsolete = '';

            const obsoleteReason = optional(tokens, 'string');

            if (obsoleteReason) {
                pnode.obsolete = obsoleteReason.value;
            }
        }

        parent.childNodes.push(pnode);

        scope2 = optional(tokens, 'operator', '}');
    }
}

function expect(tokens, name, value) {
    const peek = tokens[FIRST];

    if (!peek) {
        return LanguageParser.Token('EOF', '');
    }

    if (peek.name !== name || value && peek.value !== value) {
        throw new Error(`Expecting ${name}`);
    }

    return tokens.shift();
}

function optional(tokens, name, value) {
    const peek = tokens[FIRST];

    if (!peek) {
        return new LanguageParser.Token('EOF', '');
    }

    if (peek.name !== name || value && peek.value !== value) {
        return null;
    }

    return tokens.shift();
}

module.exports = {
    Node,
    ClassNode,
    PropNode,
    EnumNode,
    analyze,
};
