webrs-server
---

This is the server-side (i.e., backend) of nato internet services' [`webrs`](https://rs.nat.moe). For the client-side, check [webrs-client](https://github.com/nat-lab/webrs-client).

### Configuring

`webrs-server` takes a JSON file as configuration. Configurable fields are as below:

```Typescript
interface Configuration {
    host: string;
    port: number;
    entry_point: {
        path: string;
        args: string[];
    };
};
```

See [`config.json`](./config.json) for example.

### Building

You will need to have NodeJS ready before you can build the web app. 

```
$ git clone https://github.com/nat-lab/webrs-server
$ cd webrs-server
$ npm i
$ npm install -g typescript
$ tsc
```

### Usage

You will need to run `bin/main.js` with sufficient permission to launch the program specified as your `entry_point`. For example, if you are using BIRD, you may want to do something like this:

```
sudo -u bird node bin/main.js config.json
```

### License

`webrs-client` itself is distributed under UNLICENSE. Dependencies have their own licenses.