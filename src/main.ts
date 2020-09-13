import * as NodePty from 'node-pty';
import * as ws from 'ws';

let run = function (rsBin: string) {
    let wss = new ws.Server({
        port: 8080,
        host: "0.0.0.0"
    });

    wss.on('connection', (ws, req) => {
        let clientAddr = req.socket.remoteAddress;
        console.log(`${(new Date).toISOString()} client connected: ${clientAddr}`);

        let rows: number = 24;
        if (req.url) {
            let urlm = req.url.match(/\/([1-9]+[0-9]*)$/);
            if (urlm) {
                rows = Number.parseInt(urlm[1]);
                console.log(`${(new Date).toISOString()} client ${clientAddr}: rows: ${rows}`);
            }
        }

        let rsShell = NodePty.spawn(rsBin, [], {
            name: 'xterm-color',
            cols: 80, // bird don't actually care
            rows: rows,
        });

        rsShell.onData(data => ws.send(data));
        rsShell.onExit(() => {
            console.log(`${(new Date).toISOString()} kicking: ${clientAddr} (rs exited)`);
            ws.close();
        });

        ws.on('message', (data: string) => {
            rsShell.write(data);
        });

        ws.on('end', () => {
            console.log(`${(new Date).toISOString()} disconnected: ${clientAddr}`);
            rsShell.kill();
        });
    });
}

run('/usr/bin/routeserver');