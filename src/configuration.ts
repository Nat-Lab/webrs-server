export default interface Configuration {
    host: string;
    port: number;
    entry_point: {
        path: string;
        args: string[];
    };
};