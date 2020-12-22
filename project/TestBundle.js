/* Bundle as defined from all files in src/tests/*.js */
function Test(remote=true) {

(function (unittesting) {
    'use strict';

    unittesting.describe("Create context manager", function () {
        unittesting.it("create() with no parameters", function () {
            const ctx = create();
            let expected = ctx.state = "Hi";
            ctx.body = function (param) {
                return param;
            };
            unittesting.assert.equals({actual: ctx.state, expected});
            expected = 'echo';
            unittesting.assert.equals({actual: ctx.execute(expected), expected});
        });
        unittesting.it("create() state with one parameter", function () {
            const ctx = create([]);
            ctx.body = function (param) {
                this.push(param);
            };
            ctx.execute(1);
            unittesting.assert.arrayEquals({actual: ctx.state, expected:[1]});
        });
        unittesting.it("create() with settings", function () {
            const ctx = create([], {
              head: function () { this.push(1); },
              body: function (p) { this.push(p); return 0; },
              tail: function () { this.push(3); }
            });
            const result = ctx.execute(2);
            unittesting.assert.arrayEquals({actual: ctx.state, expected:[1, 2, 3]});
            unittesting.assert.equals({actual: result, expected: 0});
        });
    });

    unittesting.describe("dependencies can be defined", function () {
        class MockedLock {
          waitLock (timeout) {
            return null;
          }

          releaseLock () {
            return null;
          }
        }
        class MockedLockService {
          static getScriptLock () {
            return new MockedLock();
          }
        }
        unittesting.it("uses dependencies", function () {
            const ctx = usingWaitLock(500, "script", {
                Lock_Service: MockedLockService
            });
        });
    });

}(unittesting));
try { return Log.get() } catch (e) {} 
}
