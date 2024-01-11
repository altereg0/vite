import { program } from 'commander';
import figlet from 'figlet';
import * as fs from 'fs';
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

async function main() {
    // const say = opts.say;
    // const binance = opts.binance;
    console.log(figlet.textSync('Middleware'));
    const middleware = opts.middleware;
    if (middleware) {
        log.info('Middleware demo');
        await middlewareDemo();
        log.info('Poppins Middleware demo');
        await middlewarePoppins();
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
                await new Promise((resolve) => setTimeout(resolve, 5000));
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
        await new Promise((resolve) => setTimeout(resolve, 5000));
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

main().catch(console.error);
