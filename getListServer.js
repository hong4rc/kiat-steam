'use strict';
const fs = require('fs');
const Steam = require('./');

const client = new Steam.SteamClient();
const steamUser = new Steam.SteamUser(client);

client.connect();

client.on('connected', () => {
    steamUser.logOn({
        account_name: 'your_username',
        /*
        login_key: 'your_login_key',
        /*/
        password: 'your_password',
        should_remember_password: true,
        two_factor_code: 'factor_code_if_need'//*/
    });
});
client.on('servers', servers => {
    servers.sort((a, b) => {
        let aHost = a.host.split('.').map(a=>a.padStart(3, ' ')).join('.');
        let bHost = b.host.split('.').map(a=>a.padStart(3, ' ')).join('.');
        return aHost.localeCompare(bHost) || a.port > b.port;
    });
    console.log(servers);
    client.disconnect();
    fs.writeFileSync('./lib/servers.json', JSON.stringify(servers, null, 4));
});
