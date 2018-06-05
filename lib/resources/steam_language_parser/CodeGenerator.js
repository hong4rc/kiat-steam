'use strict';

const SymbolLocator = require('./parser/SymbolLocator');
const TokenAnalyzer = require('./parser/TokenAnalyzer');

function TypeInfo(size, unsigned) {
    this.size = size;
    this.signed = !unsigned;
    this.signedType = unsigned;
}

const DEFAULT_TYPE = 'uint';
const SUPPORT_LVL = 1;
const SizeType = {
    none: 0,
    byte: 1,
    short: 2,
    int: 4,
    long: 8
};
const weakTypeMap = {
    byte: new TypeInfo(SizeType.byte),
    short: new TypeInfo(SizeType.short),
    ushort: new TypeInfo(SizeType.short, 'short'),
    int: new TypeInfo(SizeType.int),
    uint: new TypeInfo(SizeType.int, 'int'),
    long: new TypeInfo(SizeType.long),
    ulong: new TypeInfo(SizeType.long, 'long'),
};

const getTypeOfSize = function (size, unsigned) {
    for (const key in weakTypeMap) {
        if (weakTypeMap[key].size === size) {
            if (unsigned && !weakTypeMap[key].signed) {
                return key;
            } else if (weakTypeMap[key].signed) {
                return key;
            } else if (!weakTypeMap[key].signed) {
                return weakTypeMap[key].signedType;
            }
        }
    }

    return 'bad';
};

const getTypeSize = function (prop) {
    const sym = prop.type;

    // no static size for proto
    if (prop.flags === 'proto') {
        return SizeType.none;
    }

    if (sym instanceof SymbolLocator.WeakSymbol) {
        let key = sym.identifier;

        if (!weakTypeMap[key]) {
            key = DEFAULT_TYPE;
        }

        if (prop.flagsOpt) {
            return Number(prop.flagsOpt);
        }

        return weakTypeMap[key].size;
    } else if (sym instanceof SymbolLocator.StrongSymbol) {
        if (sym.class instanceof TokenAnalyzer.EnumNode) {
            const eNode = sym.class;

            if (eNode.type instanceof SymbolLocator.WeakSymbol) {
                return weakTypeMap[eNode.type.identifier].size;
            } else {
                return weakTypeMap[DEFAULT_TYPE].size;
            }
        }
    }

    return SizeType.none;
};

const emitCode = function (root, gen, sb) {
    let level = 0;
    if (gen.supportsNamespace()) {
        level = SUPPORT_LVL;
    }

    root.childNodes.forEach(n => {
        gen.emitNode(n, sb, level);
    });
};
module.exports = {
    emitCode,
    getTypeSize,
    getTypeOfSize
};
