'use strict';

const ByteBuffer = require('bytebuffer');
const Steam = require('../..');
const CodeGenerator = require('../CodeGenerator');
const SymbolLocator = require('../parser/SymbolLocator');
const TokenAnalyzer = require('../parser/TokenAnalyzer');

const readerTypeMap = {
    byte: 'Byte',
    short: 'Int16',
    ushort: 'Uint16',
    int: 'Int32',
    uint: 'Uint32',
    long: 'Int64',
    ulong: 'Uint64'
};

const PROTO_MASK = 0x80000000;
const SYM_INDEX = 0;
const FIRST = 0;
const ONE = 1;
const DEFAULT_SYS_NAME = 0;

const emitType = function (sym) {
    if (sym instanceof SymbolLocator.WeakSymbol) {
        return sym.identifier;
    } else if (sym instanceof SymbolLocator.StrongSymbol) {
        if (!sym.prop) {
            return sym.class.name;
        } else {
            return (Steam.Internal[sym.class.name] || Steam[sym.class.name])[sym.prop.name];
        }
    }

    return 'INVALID';
};

const emitNode = function (n) {
    if (n instanceof TokenAnalyzer.ClassNode) {
        emitClassNode(n);
    } else if (n instanceof TokenAnalyzer.EnumNode) {
        emitEnumNode(n);
    }
};


function emitEnumNode(enode) {
    const obj = Steam[enode.name] = {};
    enode.childNodes.forEach(prop => {
        obj[prop.name] = prop.default.map(sym => obj[sym.identifier] || Number(sym.identifier))
            .reduce((value, ident) => value | ident);
    });
}

function emitClassNode(cnode) {
    emitClassConstructor(cnode);
    const baseSize = emitClassProperties(cnode);

    emitClassEncoder(cnode, baseSize);
    emitClassDecoder(cnode, baseSize);
}

function emitClassConstructor(cnode) {
    Steam.Internal[cnode.name] = function (object) {
        object = object || {};

        cnode.childNodes.forEach(prop => {
            const defSym = prop.default[SYM_INDEX];
            const defFlags = prop.flags;

            if (defFlags === 'const') {
                return;
            }

            const symName = prop.name;
            let ctor = emitType(defSym);

            if (defFlags === 'proto') {
                ctor = new (emitType(prop.type).split('.').slice(ONE)
                    .reduce((obj, prop) => obj[prop], Steam))(object[symName] || {});
            } else if (!defSym) {
                if (prop.flagsOpt) {
                    ctor = object[symName]
                        ? ByteBuffer.isBuffer(object[symName])
                            ? object[symName]
                            : ByteBuffer.wrap(object[symName])
                        : new ByteBuffer(CodeGenerator.getTypeSize(prop));
                } else {
                    ctor = object[symName] || DEFAULT_SYS_NAME;
                    if (['long', 'ulong'].indexOf(emitType(prop.type)) >= FIRST) {
                        ctor = ByteBuffer.Long.fromValue(ctor);
                    }
                }
            } else if (['long', 'ulong'].indexOf(emitType(prop.type)) >= FIRST) {
                if (ctor === 'ulong.MaxValue') {
                    ctor = ByteBuffer.Long.MAX_UNSIGNED_VALUE;
                }
                ctor = ByteBuffer.Long.fromValue(object[symName] || ctor);
            } else {
                ctor = object[symName] || Number(ctor);
            }

            this[symName] = ctor;
        });
    };
}

function emitClassProperties(cnode) {
    let baseClassSize = 0;

    cnode.childNodes.forEach(prop => {
        const propName = prop.name;

        if (prop.flags === 'const') {
            const ctor = emitType(prop.default[FIRST]);
            Steam.Internal[cnode.name][propName] = Number(ctor);
            return;
        }

        baseClassSize += CodeGenerator.getTypeSize(prop);
    });

    return baseClassSize;
}

function emitClassEncoder(cnode, baseSize) {
    Steam.Internal[cnode.name].prototype.encode = function () {

        // first emit variable length members
        const varLengthProps = [];

        cnode.childNodes.forEach(prop => {
            const size = CodeGenerator.getTypeSize(prop);

            if (!size) {
                const bb = this[prop.name].encode();

                if (prop.flagsOpt !== null) {
                    this[prop.flagsOpt] = bb.limit;
                }

                varLengthProps.push(bb);
            }
        });
        const limits = varLengthProps.reduce((capacity, bb) => capacity + bb.limit, FIRST);
        const bb = new ByteBuffer(baseSize + limits, ByteBuffer.LITTLE_ENDIAN);

        // next emit writers
        cnode.childNodes.forEach(prop => {
            let type = emitType(prop.type);
            const size = CodeGenerator.getTypeSize(prop);

            if (prop.flags === 'proto') {
                varLengthProps.shift().copyTo(bb);
                return;
            } else if (prop.flags === 'const') {
                return;
            }

            if (!readerTypeMap[type]) {
                type = CodeGenerator.getTypeOfSize(size, supportsUnsignedTypes());
            }

            if (prop.flagsOpt) {
                this[prop.name].copyTo(bb);
            } else {
                let size = this[prop.name];
                if (['protomask', 'protomaskgc'].indexOf(prop.flags) >= FIRST) {
                    size |= PROTO_MASK;
                }
                bb[`write${readerTypeMap[type]}`](size);
            }
        });

        bb.flip();
        return bb;
    };

    Steam.Internal[cnode.name].prototype.toBuffer = function () {
        return this.encode().toBuffer();
    };
}

function emitClassDecoder(cnode) {
    Steam.Internal[cnode.name].decode = function (buffer) {
        if (!ByteBuffer.isByteBuffer(buffer)) {
            buffer = ByteBuffer.wrap(buffer, ByteBuffer.LITTLE_ENDIAN);
        }

        const object = {};
        cnode.childNodes.forEach(prop => {
            let typestr = emitType(prop.type);
            const size = CodeGenerator.getTypeSize(prop);

            const defflags = prop.flags;
            const symname = prop.name;

            if (defflags === 'const') {
                return;
            }

            if (!size) {

                // assume protobuf
                object[symname] = typestr.split('.').slice(ONE).reduce((obj, prop) => obj[prop], Steam)
                    .decode(buffer.readBytes(object[prop.flagsOpt]));
            } else {
                if (!readerTypeMap[typestr]) {
                    typestr = CodeGenerator.getTypeOfSize(size, supportsUnsignedTypes());
                }

                if (prop.flagsOpt) {
                    object[symname] = buffer.readBytes(Number(prop.flagsOpt));
                } else {
                    object[symname] = buffer[`read${readerTypeMap[typestr]}`]();
                    if (['protomask', 'protomaskgc'].indexOf(prop.flags) >= FIRST) {
                        object[symname] &= ~PROTO_MASK;
                    }
                }
            }
        });

        return object;
    };
}

const supportsUnsignedTypes = function () {
    return true;
};

const supportsNamespace = function () {
    return true;
};


module.exports = {
    emitNode,
    supportsNamespace,
};
