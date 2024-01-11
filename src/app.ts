import { program } from 'commander';
import WebSocket from 'ws';
import figlet from 'figlet';
import * as fs from 'fs';
import inquirer from 'inquirer';
import * as dotenv from 'dotenv';
import * as log from './console-logger';
import { pipeline } from './middleware/middleware.example';
import { Middleware } from '../src/poppins/middleware';
import { type NextFn } from './poppins/types';

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

async function main() {
    // const say = opts.say;
    // const binance = opts.binance;

    const middleware = opts.middleware;
    if (middleware) {
        log.info('Middleware demo');
        await middlewareDemo();
        
        // await middlewarePoppins();
        // => { foobar: "baz", another: 123 }
    }
}

async function middlewarePoppins() {
    interface IContext {
        stack: string[];
    }
    const context: IContext = { stack: [] };

    type MiddlewareFn = (
        ctx: typeof context,
        next: NextFn
    ) => void | Promise<void>;

    const middleware = new Middleware<MiddlewareFn>();

    middleware.add(async function (ctx, next) {
        log.info('FN: 1');
        ctx.stack.push('MW 1 UP');
        await next();
        ctx.stack.push('MW 1 AFTER');
        log.info('FN: 1 AFTER');
    });

    middleware.add(async function (ctx, next) {
        log.info('FN: 2');
        ctx.stack.push('MW 2 UP');
        // throw new Error('Something went wrong');
        await next();
        ctx.stack.push('MW 2 AFTER');
        log.info('FN: 2 AFTER');
    });
    middleware.add(async function (ctx, next) {
        log.info('FN: 3');
        ctx.stack.push('MW 3 UP');
        // ctx.stack.push(42);
                await new Promise((res) => setTimeout(res, 5000));
        // throw new Error('Something went wrong');
        await next();
        ctx.stack.push('MW 3 AFTER');
        log.info('FN: 3 AFTER');
    });
    middleware.add(async function (ctx, next) {
        log.info('FN: 4');
        ctx.stack.push('MW 4 UP');
        await next();
        ctx.stack.push('MW 4 AFTER');
        log.info('FN: 4 AFTER');
    });

    const runner = middleware.runner();
    await runner
        .errorHandler(async (error) => {
            log.error(error);
            context.stack.push('error handler');
        })
        .finalHandler(async () => {
            context.stack.push('final handler');
            log.warn('FINAL HANDLER');
        })
        .run(async (fn, next) => {await fn(context, next)});

    log.warn(JSON.stringify(context));
}

/* eslint-disable @typescript-eslint/no-unused-vars */
async function middlewareDemo() {
    type Context = Record<string, any>;
    // type Context = { foobar: string, another: number };

    const engine = pipeline<Context>(async (ctx, next) => {
        log.debug('FN: 1');
        ctx.fuk = 'you';
        await next();
        log.debug('FN: 1 AFTER');
    });

    engine.use(async (ctx, next) => {
        log.debug('FN: 2');
        ctx.another = 123;
        await next();
        log.debug('FN: 2 AFTER');
    });

    engine.use(async (ctx, next) => {
        log.debug('FN: 3');
        ctx.foo = "bar";
        // throw new Error('Something went wrong');
        await next();
        log.debug('FN: 3 AFTER');
    });
    
    engine.use(async (ctx, next) => {
        log.debug('FN: 4');
        ctx.fiz = "baz";
        await new Promise((res) => setTimeout(res, 5000));
        await next();
        log.debug('FN: 4 AFTER');
    });

    await (async () => {
        const context: Context = {
            foobar: '',
            another: 0,
        };
        log.debug('CALLBACK BEFORE');
        await engine.execute(context);
        log.info(JSON.stringify(context));
        log.debug('CALLBACK AFTER');
    })().catch((error)=>{
        log.error(error);
    });
}

/* eslint-disable @typescript-eslint/no-unused-vars */
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

async function deleteMain() {
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
}
async function demoMiddleware() {
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
}

main().catch(console.error);
