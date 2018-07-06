'use strict';
const fs = require('fs');
const Steam = require('./');

const client = new Steam.SteamClient();
const steamUser = new Steam.SteamUser(client);

const MAX_NUM_IP = 3;
const MY_INDENT = 4;

client.connect();

const account_name = process.env.USER_NAME || 'your_username';
const password = process.env.PASS_WORD || 'your_password';
const two_factor_code = process.env.CODE || 'factor_code_if_need';
client.on('connected', () => {
    steamUser.logOn({
        account_name,

        /*
        login_key: 'your_login_key',
        /*/
        password,
        two_factor_code,
        should_remember_password: true,

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
    fs.writeFileSync('./lib/servers.json', JSON.stringify(servers, null, MY_INDENT).replace(/\n/g, '\r\n'));
});
