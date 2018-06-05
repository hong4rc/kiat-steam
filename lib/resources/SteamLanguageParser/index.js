'use strict';

const fs = require('fs');
const path = require('path');
const LanguageParser = require('./parser/LanguageParser');
const TokenAnalyzer = require('./parser/TokenAnalyzer');
const nodeGen = require('./generator/NodeGen');
const CodeGenerator = require('./CodeGenerator');

const languagePath = path.join(__dirname, '../steam_language');

const cwd = process.cwd();
process.chdir(languagePath);

const tokenList = LanguageParser.tokenizeString(fs.readFileSync('steammsg.steamd', {encoding: 'ascii'}));

const root = TokenAnalyzer.analyze(tokenList);

process.chdir(cwd);

const rootEnumNode = new TokenAnalyzer.Node();
const rootMessageNode = new TokenAnalyzer.Node();

rootEnumNode.childNodes = root.childNodes.filter(n => n instanceof TokenAnalyzer.EnumNode);
rootMessageNode.childNodes = root.childNodes.filter(n => n instanceof TokenAnalyzer.ClassNode);

CodeGenerator.emitCode(rootEnumNode, nodeGen);
CodeGenerator.emitCode(rootMessageNode, nodeGen);
