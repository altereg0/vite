/*
 * @poppinss/middleware
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { test, describe } from 'vitest';
import type { NextFn } from '../src/poppins/types.js';
import { Middleware } from '../src/poppins/middleware.js';

describe('Middleware', () => {
    test('register middleware', ({ expect }) => {
        const middleware = new Middleware();

        function handler() {}
        middleware.add(handler);

        expect(middleware.all()).toEqual(new Set([handler]));
        expect(middleware.has(handler)).toBeTruthy();
    });

    test('add middleware as an object with handle method', ({ expect }) => {
        const middleware = new Middleware();

        const handler = {
            name: 'beforeSave',
            handle() {},
        };
        middleware.add(handler);

        expect(middleware.all()).toEqual(new Set([handler]));
        expect(middleware.has(handler)).toBeTruthy();
    });

    test('add multiple middleware', ({ expect }) => {
        const middleware = new Middleware();

        function handler() {}
        middleware.add(handler);

        function handler1() {}
        middleware.add(handler1);

        expect(middleware.all()).toEqual(new Set([handler, handler1]));
        expect(middleware.has(handler)).toBeTruthy();
        expect(middleware.has(handler1)).toBeTruthy();
    });

    test('attempt to remove middleware without registering it', ({
        expect,
    }) => {
        const middleware = new Middleware();

        function handler() {}
        middleware.remove(handler);
        expect(middleware.all()).toEqual(new Set([]));
    });

    test('remove a specific middleware', ({ expect }) => {
        const middleware = new Middleware();

        function handler() {}
        middleware.add(handler);

        function handler1() {}
        middleware.add(handler1);

        expect(middleware.all()).toEqual(new Set([handler, handler1]));
        expect(middleware.has(handler)).toBeTruthy();
        expect(middleware.has(handler1)).toBeTruthy();

        middleware.remove(handler);

        expect(middleware.has(handler)).toBeFalsy();
        expect(middleware.has(handler1)).toBeTruthy();
        expect(middleware.all()).toEqual(new Set([handler1]));
    });

    test('remove object based middleware', ({ expect }) => {
        const middleware = new Middleware();

        const handler = {
            name: 'handler',
            handle() {},
        };
        middleware.add(handler);

        const handler1 = {
            name: 'handler1',
            handle() {},
        };
        middleware.add(handler1);

        expect(middleware.all()).toEqual(new Set([handler, handler1]));
        expect(middleware.has(handler)).toBeTruthy();
        expect(middleware.has(handler1)).toBeTruthy();

        middleware.remove(handler);

        expect(middleware.has(handler)).toBeFalsy();
        expect(middleware.has(handler1)).toBeTruthy();
        expect(middleware.all()).toEqual(new Set([handler1]));
    });

    test('clear all middleware handlers', ({ expect }) => {
        const middleware = new Middleware();

        function handler() {}
        middleware.add(handler);

        function handler1() {}
        middleware.add(handler1);

        expect(middleware.all()).toEqual(new Set([handler, handler1]));
        expect(middleware.has(handler)).toBeTruthy();
        expect(middleware.has(handler1)).toBeTruthy();

        middleware.clear();

        expect(middleware.has(handler)).toBeFalsy();
        expect(middleware.has(handler1)).toBeFalsy();
        expect(middleware.all()).toEqual(new Set([]));
    });

    test('merge middleware handlers from another middleware instance', ({
        expect,
    }) => {
        const middleware = new Middleware();

        function handler() {}
        middleware.add(handler);

        const middleware1 = new Middleware();
        middleware1.merge(middleware);

        expect(middleware.all()).toEqual(new Set([handler]));
        expect(middleware1.all()).toEqual(new Set([handler]));
    });

    test('merge middleware handlers over existing handlers', ({ expect }) => {
        const middleware = new Middleware();

        function handler() {}
        middleware.add(handler);

        const middleware1 = new Middleware();

        function handler1() {}
        middleware1.add(handler1);
        middleware1.merge(middleware);

        expect(middleware.all()).toEqual(new Set([handler]));
        expect(middleware1.all()).toEqual(new Set([handler, handler1]));
    });

    test('execute middleware handlers', async ({ expect }) => {
        const chain: string[] = [];
        const middleware = new Middleware<(_: any, next: NextFn) => any>();

        middleware.add((_, next) => {
            chain.push('first');
            return next();
        });

        middleware.add((_, next) => {
            chain.push('second');
            return next();
        });

        middleware.add((_, next) => {
            chain.push('third');
            return next();
        });

        await middleware.runner().run((fn, next) => fn({}, next));
        expect(chain).toEqual(['first', 'second', 'third']);
    });

    test('freeze middleware stack', ({ expect }) => {
        const middleware = new Middleware();

        function handler() {}
        middleware.add(handler);

        middleware.freeze();

        expect(
            () => middleware.add(handler),
            'Middleware stack is frozen. Cannot add new middleware'
        ).toThrowError();
        expect(
            () => middleware.remove(handler),
            'Middleware stack is frozen. Cannot remove middleware'
        ).toThrowError();
        expect(() => {
            middleware.clear();
        }, 'Middleware stack is frozen. Cannot clear middleware').toThrowError();
        expect(() => {
            middleware.merge(new Middleware());
        }, 'Middleware stack is frozen. Cannot merge middleware').toThrowError();

        expect(middleware.all()).toEqual(new Set([handler]));
        expect(middleware.has(handler)).toBeTruthy();
    });
});
