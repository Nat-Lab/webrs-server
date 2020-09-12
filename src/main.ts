import { connect } from 'http2';
import { Duplex } from 'stream';
const Telnet = require('telnet-client');
const WebSocket = require('ws');

let run = async function (server: string, port: number, encoding: BufferEncoding = 'utf-8') {
    let wss = new WebSocket.Server({
        port: 8080,
        host: "0.0.0.0"
    });

    wss.on('connection', async function connection(ws: any) {
        console.log('client connected, connecting to rs...');

        let telnet = new Telnet();
        let ldata: string = '';
        let skip = 0;

        await telnet.connect({
            host: server,
            port: port,
            negotiationMandatory: false
        });

        let stream: Duplex = await telnet.shell();

        console.log('connected to rs.');

        ws.on('message', (message: any) => {
            ldata = message;
            stream.write(message);
        });

        ws.on('close', () => {
            console.log('client left, disconnecting rs.');
            telnet.end();
        });

        telnet.on('end', () => {
            console.log('rs left, kicking client.');
            ws.close();
        });

        stream.on('data', (data: Buffer) => {
            if (skip < 3) {
                skip++;
                return;
            }
            let datastr: string = data.toString(encoding);
            if (datastr != ldata) {
                ws.send(data);
            }
            ldata = '';
        });
    });
}

run("rs.nat.moe", 23);