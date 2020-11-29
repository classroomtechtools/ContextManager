import test from 'ava';
import {ContextManager} from '../src/modules/ContextManager.js';

const nullDependencies = {
    Lock_Service: null,
    Spread_sheet_App: null
};

test("usingWaitLock throws error on incorrect guard value", t => {
    t.throws(function () {
        const ctx = ContextManager.usingWaitLock({
            timeout: 500,
            guard: "error"}, nullDependencies);
    }, {instanceOf: TypeError, message: /No such guard/});
});

test("usingWaitLock throws error on incorrect parameter", t => {
    t.throws(function () {
        const ctx = ContextManager.usingWaitLock({
            timeout: 500,
            gaurd: "user"}, nullDependencies);
    }, {instanceOf: TypeError, message: /Invalid param passed/});
});
