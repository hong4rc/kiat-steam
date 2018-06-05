'use strict';

const Steam = require('./resources');

const servers = require('./servers');
const SteamClient = require('./steam_client');
const SteamFriends = require('./handlers/friends');
const SteamGameCoordinator = require('./handlers/game_coordinator');
const SteamRichPresence = require('./handlers/rich_presence');
const SteamTrading = require('./handlers/trading');
const SteamUnifiedMessages = require('./handlers/unified_messages');
const SteamUser = require('./handlers/user');

Steam.servers = servers;
Steam.SteamClient = SteamClient;
Steam.SteamFriends = SteamFriends;
Steam.SteamGameCoordinator = SteamGameCoordinator;
Steam.SteamRichPresence = SteamRichPresence;
Steam.SteamTrading = SteamTrading;
Steam.SteamUnifiedMessages = SteamUnifiedMessages;
Steam.SteamUser = SteamUser;
Steam._processProto = function (proto) {
    proto = proto.toRaw(false, true);
    (function deleteNulls(proto) {
        for (const field in proto) {
            if (proto.hasOwnProperty(field)) {
                if (proto[field] === null) {
                    delete proto[field];
                } else if (typeof proto[field] === 'object') {
                    deleteNulls(proto[field]);
                }
            }

        }
    })(proto);
    return proto;
};

module.exports = Steam;
