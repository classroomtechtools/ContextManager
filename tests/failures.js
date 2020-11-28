import test from 'ava';
import {ContextManager} from '../src/modules/ContextManager.js';

test("usingWaitLock throws error on incorrect guard value", t => {
    t.throws(function () {
        const ctx = ContextManager.usingWaitLock({
            timeout: 500,
            guard: "error",
            Lock_Service: 'LockService',
            Spread_sheet_App: 'SpreadsheetApp'
        });
    }, {instanceOf: TypeError, message: /No such guard/});
});

test("usingWaitLock throws error on incorrect parameter", t => {
    t.throws(function () {
        const ctx = ContextManager.usingWaitLock({
            timeout: 500,
            gaurd: "user",  // mispelled
            Lock_Service: 'LockService',
            Spread_sheet_App: 'SpreadsheetApp'
        });
    }, {instanceOf: TypeError, message: /Invalid param passed/});
});
