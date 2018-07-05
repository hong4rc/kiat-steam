'use strict';

const StrongSymbol = function (classNode, prop) {
    this.class = classNode;
    this.prop = prop;
};

const WeakSymbol = function (identifier) {
    this.identifier = identifier;
};

const identifierPattern = '([a-zA-Z0-9_:]*)';
const fullPattern = '([a-zA-Z0-9_]*?)::([a-zA-Z0-9_]*)';
const FIRST = 0;
const CLASS_INDEX = 1;
const PROP_INDEX = 2;

const identifierRegex = new RegExp(identifierPattern);
const fullRegex = new RegExp(fullPattern);

function findNode(tree, symbol) {
    for (let i = 0; i < tree.childNodes.length; i++) {
        if (tree.childNodes[i].name === symbol) {
            return tree.childNodes[i];
        }
    }
}

const lookupSymbol = function (tree, mIdentifier, strongOnly) {
    let identifier = identifierRegex.exec(mIdentifier);

    if (!identifier) {
        throw new Error(`Invalid identifier specified ${mIdentifier}`);
    }

    let classNode;

    // console.log('db', !~identifier.indexOf('::'), identifier.indexOf('::') >= FIRST, identifier.indexOf('::'));
    if (mIdentifier.indexOf('::') < FIRST) {
        classNode = findNode(tree, identifier[FIRST]);

        if (!classNode) {
            if (strongOnly) {
                throw new Error(`Invalid weak symbol ${mIdentifier}`);
            } else {
                return new WeakSymbol(mIdentifier);
            }
        } else {
            return new StrongSymbol(classNode);
        }
    } else {
        identifier = fullRegex.exec(mIdentifier);

        if (!identifier) {
            throw new Error('Couldn\'t parse full identifier');
        }

        classNode = findNode(tree, identifier[CLASS_INDEX]);

        if (!classNode) {
            throw new Error(`Invalid class in identifier ${mIdentifier}`);
        }

        const propNode = findNode(classNode, identifier[PROP_INDEX]);

        if (!propNode) {
            throw new Error(`Invalid property in identifier ${mIdentifier}`);
        }

        return new StrongSymbol(classNode, propNode);
    }
};
module.exports = {
    StrongSymbol,
    WeakSymbol,
    lookupSymbol,
};
