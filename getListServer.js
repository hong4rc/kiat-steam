'use strict';
const fs = require('fs');
const Steam = require('./');

const client = new Steam.SteamClient();
const steamUser = new Steam.SteamUser(client);

const MAX_NUM_IP = 3;
const MY_INDENT = 4;

client.connect();

client.on('connected', () => {
    steamUser.logOn({
        account_name: 'your_username',

        /*
        login_key: 'your_login_key',
        /*/
        password: 'your_password',
        should_remember_password: true,
        two_factor_code: 'factor_code_if_need',

        //* /
    });
});
client.on('servers', servers => {
    servers.sort((a, b) => {
        const aHost = a.host.split('.').map(a => a.padStart(MAX_NUM_IP, ' ')).join('.');
        const bHost = b.host.split('.').map(a => a.padStart(MAX_NUM_IP, ' ')).join('.');
        return aHost.localeCompare(bHost) || String(a.port).localeCompare(String(b.port));
    });
    client.disconnect();
    fs.writeFileSync('./lib/servers.json', JSON.stringify(servers, null, MY_INDENT));
});
