'use strict';

const Token = function (name, value) {
    this.name = name;
    this.value = value;
};

const START_POINT = 2;
const groupNames = [
    '',
    'whitespace',
    'terminator',
    'string',
    'comment',
    'identifier',
    'preprocess',
    'operator',
    'invalid'
];

const regPtn = /(\s+)|(;)|"(.+?)"|\/\/(.*)$|(-?[a-zA-Z_0-9][a-zA-Z0-9_:.]*)|[#]([a-zA-Z]*)|([{}<>\]=|])|([^\s]+)/gm;

const tokenizeString = function (buffer) {
    let match;

    const tokenList = [];
    while (match = regPtn.exec(buffer)) {
        for (let i = START_POINT; i < match.length; i++) {
            if (match[i]) {
                const groupName = groupNames[i];

                // don't create tokens for comments
                if (groupName === 'comment') {
                    continue;
                }
                tokenList.push(new Token(groupName, match[i]));
            }
        }

    }

    return tokenList;
};
module.exports = {
    Token,
    tokenizeString
};
