import { program } from 'commander';
import WebSocket from 'ws';
import figlet from 'figlet';
import * as fs from 'fs';
import inquirer from 'inquirer';
import * as dotenv from 'dotenv';
import * as log from './console-logger';

dotenv.config({ path: '.env' });

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

program
    .version(packageJson.version)
    .option('-say, --say <string>', 'Say something')
    .option('-bnb, --binance', 'Launch Binance Websocket')
    .option('-mw, --middleware', 'Launch Middleware demo')
    .parse(process.argv);

const opts = program.opts();

function pri(_value: number, _decimal: number, _total: number) {
    const _str = '                ' + _value.toFixed(_decimal);
    return _str.substring(_str.length - _total);
}

async function demoBinance() {
    console.log(figlet.textSync(process.env.APP_TITLE ?? 'Binance'));

    const ws = new WebSocket(
        'wss://stream.binance.com:9443/ws/ltcusdt@aggTrade'
    );

    ws.on('open', function open() {
        log.warn('WebSocket connected');
    });

    ws.on('message', function incoming(data: string) {
        const trade = JSON.parse(data);

        // log.info(JSON.stringify(trade));
        log.info(
            `${pri(trade.p * 1, 8, 15)} : ${pri(trade.q * 1, 8, 15)} = ${pri(
                trade.p * trade.q,
                6,
                15
            )} : ${trade.m}`
        );
    });

    ws.on('error', function error(error: any) {
        log.error(error);
    });
}

async function main() {
    // eslint-disable-line no-unused-vars
    console.log(figlet.textSync(process.env.APP_TITLE ?? 'My App'));

    let say = opts.say;
    if (say === undefined) {
        log.warn('No `say` option provided');
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'say',
                message: 'Say:',
            },
        ]);
        say = answers.say;
    }
    log.info(`👋 ${say}`);

    const binance = opts.binance;
    if (binance) {
        await demoBinance();
    }
}

main().catch(console.error);
