'use strict';

const Steam = require('./resources');

const servers = require('./servers');
const SteamClient = require('./SteamClient');
const SteamFriends = require('./handlers/Friends');
const SteamGameCoordinator = require('./handlers/GameCoordinator');
const SteamRichPresence = require('./handlers/RichPresence');
const SteamTrading = require('./handlers/Trading');
const SteamUnifiedMessages = require('./handlers/UnifiedMessages');
const SteamUser = require('./handlers/User');

const deleteNulls = proto => {
    for (const field in proto) {
        if (proto.hasOwnProperty(field)) {
            if (proto[field] === null) {
                delete proto[field];
            } else if (typeof proto[field] === 'object') {
                deleteNulls(proto[field]);
            }
        }
    }
};

Steam.servers = servers;
Steam.SteamClient = SteamClient;
Steam.SteamFriends = SteamFriends;
Steam.SteamGameCoordinator = SteamGameCoordinator;
Steam.SteamRichPresence = SteamRichPresence;
Steam.SteamTrading = SteamTrading;
Steam.SteamUnifiedMessages = SteamUnifiedMessages;
Steam.SteamUser = SteamUser;
Steam._processProto = proto => {
    proto = proto.toRaw(false, true);
    deleteNulls(proto);
    return proto;
};

module.exports = Steam;
