import * as NodePty from 'node-pty';
import * as ws from 'ws';
const pkg: any = require('../package.json');

let run = function (rsBin: string) {
    let wss = new ws.Server({
        port: 8080,
        host: '0.0.0.0'
    });

    wss.on('connection', (ws, req) => {
        let clientAddr = req.socket.remoteAddress;
        console.log(`${(new Date).toISOString()} client connected: ${clientAddr}`);
        ws.send(`\x1b[0;30mnato webrs server ${pkg.version} ready.\x1b[0m\r\n`);
        ws.send(`\x1b[0;30mattaching to pty...\x1b[0m\r\n`);

        let rsShell = NodePty.spawn(rsBin, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
        });

        rsShell.onData(data => ws.send(data));
        rsShell.onExit(() => {
            console.log(`${(new Date).toISOString()} kicking: ${clientAddr} (rs exited)`);
            ws.close();
        });

        ws.on('message', (data: string) => {
            if (data.length > 4 && data.substr(0, 4) == '\t\r\n\t') { // control messages
                let msg = data.substr(4);
                console.log(`${(new Date).toISOString()} ${clientAddr}: got control message: "${msg}"`);
                let [type, payload] = msg.split(';');
                if (type == 'termsz') {
                    let [rows, cols] = payload.split(',');
                    let _rows: number = Number.parseInt(rows);
                    let _cols: number = Number.parseInt(cols);
                    console.log(`${(new Date).toISOString()} ${clientAddr}: term size changed (${_cols}x${_rows})`);
                    rsShell.resize(_cols, _rows);
                };
                return;
            }
            rsShell.write(data);
        });

        ws.on('close', () => {
            console.log(`${(new Date).toISOString()} disconnected: ${clientAddr}`);
            rsShell.kill();
        });
    });
}

run('/usr/bin/routeserver');