import { test, expect } from 'vitest';

import { pipeline } from '../src/middleware.example';

type TestContext = Record<string, any>;

test('Creates a new middleware pipeline.', async () => {
    const engine = pipeline<TestContext>(async (ctx, next) => {
        ctx.foobar = 'baz';
        await next();
    });

    const ctx = {};
    await engine.execute(ctx);
    expect(ctx).toHaveProperty('foobar');
});

test('Context is correct when using async middleware', async () => {
    const engine = pipeline<TestContext>(async (ctx, next) => {
        ctx.foobar = 'baz';
        await next();
    });

    engine.use(async (ctx, next) => {
        ctx.another = 123;
        await new Promise<void>((resolve) => setTimeout(resolve, 2000));
        await next();
    });

    engine.use(async (ctx, next) => {
        ctx.three = 123;
        await new Promise<void>((resolve) => setTimeout(resolve, 2000));
        await next();
    });

    const context: TestContext = {};
    await engine.execute(context);
    expect(context.three).toEqual(123);
});

test('Context is correct when using async middleware', async () => {
    type TestContext = Record<string, any>;

    const engine = pipeline<TestContext>(async (ctx, next) => {
        ctx.foobar = 'baz';
        await new Promise<void>((resolve) => setTimeout(resolve, 2000)); // Mock a real-world async function
        next().catch((error) => {
            // handle your error here
            console.log(
                'Inside error, fetching product line items failed',
                error
            );
        });
    });

    engine.use(async (ctx, next) => {
        ctx.another = 123;
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Mock a real-world async function
        await next();
    });

    const context: TestContext = {};
    await engine.execute(context);
    expect(context.another).toEqual(123);
});

test('Errors are handled by error middleware', async () => {
    type TestContext = Record<string, any>;

    const engine = pipeline<TestContext>(async (ctx, next) => {
        ctx.foobar = 'baz';
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Mock a real-world async function
        await next();
    });

    engine.use(
        async (ctx, next) => {
            await next(new Error('This is an error'));
        },
        async (ctx, next) => {
            ctx.another = 123;
        },
        async (ctx, next, error) => {
            if (error) ctx.error = error.message;
            await next();
        }
    );

    const context: TestContext = {};
    await engine.execute(context);
    expect(context.error).toBe('This is an error');
    expect(context.another).toBeUndefined();
});
