import test from 'ava';
import {ContextManager} from '../src/modules/ContextManager.js';


test(".state saves and is available after execution", t => {
  let ctx = ContextManager.new_();
  ctx.with(function () {
    this.hi = 'hi'
  });
  let actual = ctx.state;
  let expected = {hi: 'hi'};
  t.deepEqual(actual, expected);
});

test("subclassing to get different defaultObject", t => {
  class MyContextManager extends ContextManager {
    defaultObject () { return []; };
  }
  let ctx = new MyContextManager();
  ctx.with(function () {
    this.push('hi');
  });
  let actual = ctx.state;
  let expected = ['hi'];
  t.deepEqual(actual, expected);
});

test("default error handler does not swallow error", t => {
  const ctx = ContextManager.new_();
  t.throws(function () {
    ctx.with(function () {
      throw new Error("Error");
    });
  }, {instanceOf:Error});
});

test("default error handler does not swallow error in enter", t => {
  const ctx = ContextManager.new_();
  ctx.enter = function () {
    throw new Error("Yikes");
  }
  t.throws(function () {
    ctx.with(function () {

    });
  }, {instanceOf:Error});
});

test("error handler swallows error by returning null", t => {
  let ctx = new ContextManager();
  ctx.error = function (err) {
    this.errorMessage = err.toString();
    return null;
  };
  ctx.with(function () {
    throw new Error("message");
  });
  let actual = ctx.state;
  let expected = {errorMessage: "Error: message"};
  t.deepEqual(actual, expected);
});

test("Saves state between enter and exit calls, return this", t => {
  let ctx = new ContextManager();
  ctx.enter = function () {
    this.log = [];
    this.log.push('entering');
  };
  ctx.exit = function () {
    this.log.push('exiting');
  };

  let actual = ctx.with(function () {
    this.log.push('inside body');
    return this;
  });
  let expected = {log:['entering', 'inside body', 'exiting']};
  t.deepEqual(actual, expected);
});

test(".param is passed to with as parameter", t => {
  let ctx = new ContextManager();
  const p = "param";
  ctx.param = p;
  ctx.with(function  (param) {
    this.param = param;
  });
  let actual = ctx.state;
  let expected = {param:param};
  t.deepEqual(actual, expected);
});

test("withLock", t => {
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

  let expected = 'inside body';
  let dependencies = {
    LockService_: MockedLockService,
    SpreadsheetApp_: MockedSS
  };
  const body = ContextManager.withWaitLock(300, dependencies);
  const actual = body(function () {
    return expected;
  });
  t.is(actual, expected);

  dependencies.LockService_ = MockedLockServiceThrows;
  t.throws(function () {
    const body = ContextManager.withWaitLock(300, dependencies);
    body(function () {
        // nothing
    });
  }, {instanceOf: Error});

});
