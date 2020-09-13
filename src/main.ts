import * as NodePty from 'node-pty';
import * as ws from 'ws';

let run = function (rsBin: string) {
    let wss = new ws.Server({
        port: 8080,
        host: "0.0.0.0"
    });

    wss.on('connection', (ws) => {
        let rsShell = NodePty.spawn(rsBin, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
        });

        rsShell.onData(data => ws.send(data));
        rsShell.onExit(() => ws.close());

        ws.on('message', (data: string) => {
            rsShell.write(data);
        });

        ws.on('end', () => rsShell.kill());
    });
}

run('/usr/bin/routeserver');