import Configuration from './configuration';
import * as NodePty from 'node-pty';
import * as ws from 'ws';
import { readFile } from 'fs';
import { promisify } from 'util';

const pkg: any = require('../package.json');

let log = function(msg: string) {
    console.log(`${(new Date).toISOString()} ${msg}`);
}

let run = function (config: Configuration) {
    let wss = new ws.Server({
        port: config.port,
        host: config.host
    });

    console.log(`${(new Date).toISOString()} started webrs-server ${pkg.version} on ${config.host}:${config.port}`);

    wss.on('connection', (ws, req) => {
        let clientAddr = req.socket.remoteAddress;
        log(`client connected: ${clientAddr}`);
        ws.send(`\x1b[0;30mnato webrs server ${pkg.version} ready.\x1b[0m\r\n`);
        ws.send(`\x1b[0;30mattaching to pty...\x1b[0m\r\n`);

        let rsShell = NodePty.spawn(config.entry_point.path, config.entry_point.args, {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
        });

        rsShell.onData(data => ws.send(data));
        rsShell.onExit(() => {
            log(`kicking: ${clientAddr} (rs exited)`);
            ws.close();
        });

        ws.on('message', (data: string) => {
            if (data.length > 4 && data.substr(0, 4) == '\t\r\n\t') { // "control messages"
                let msg = data.substr(4);
                log(`${clientAddr}: got control message: "${msg}"`);
                let [type, payload] = msg.split(';');
                if (type == 'termsz') {
                    let [rows, cols] = payload.split(',');
                    let _rows: number = Number.parseInt(rows);
                    let _cols: number = Number.parseInt(cols);
                    log(`${clientAddr}: term size changed (${_cols}x${_rows})`);
                    rsShell.resize(_cols, _rows);
                };
                return;
            }
            rsShell.write(data);
        });

        ws.on('close', () => {
            log(`disconnected: ${clientAddr}`);
            rsShell.kill();
        });
    });
}


let main = async function() {
    if (process.argv.length != 3) {
        console.error('usage: webrs-server <config_file>');
        process.exit(1);
    }

    let cfgPath = process.argv[2];
    log(`using config file: ${cfgPath}.`);

    try {
        let rawConfig = await (promisify(readFile)(cfgPath, {
            encoding: 'utf-8'
        }));

        run(JSON.parse(rawConfig) as Configuration);
    } catch (e) {
        console.error(e);
    }
}

main();