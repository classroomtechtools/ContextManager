import {describe, it, assert} from '@classroomtechtools/unittesting';

describe("Create context manager", function () {
    it("create() with no parameters", function () {
        const ctx = create();
        let expected = ctx.state = "Hi";
        ctx.body = function (param) {
            return param;
        };
        assert.equals({actual: ctx.state, expected});
        expected = 'echo';
        assert.equals({actual: ctx.execute(expected), expected});
    });
    it("create() state with one parameter", function () {
        const ctx = create([]);
        ctx.body = function (param) {
            this.push(param);
        }
        ctx.execute(1);
        assert.arrayEquals({actual: ctx.state, expected:[1]});
    });
    it("create() with settings", function () {
        const ctx = create([], {
          head: function () { this.push(1); },
          body: function (p) { this.push(p); return 0; },
          tail: function () { this.push(3); }
        });
        const result = ctx.execute(2);
        assert.arrayEquals({actual: ctx.state, expected:[1, 2, 3]});
        assert.equals({actual: result, expected: 0});
    });
});

describe("dependencies can be defined", function () {
    class MockedSS {
      static flush () {
        return null;
      }
    }
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
    class MockedLockThrows extends (MockedLock) {
      waitLock (timeout) {
        throw new Error("Timeout!");
      }
    }
    class MockedLockServiceThrows {
      static getScriptLock () {
        return new MockedLockThrows();
      }
    }
    it("uses dependencies", function () {
        const ctx = usingWaitLock(500, "script", {
            Spread_sheet_App: MockedSS,
            Lock_Service: MockedLockService
        });
    });
});
