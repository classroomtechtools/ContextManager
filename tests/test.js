import test from 'ava';
import {ContextManager} from '../src/modules/ContextManager.js';

test("set context.body and context.execute for multiple invocations", t => {
  const ctx = ContextManager.new_();
  ctx.body = function (param) {
    this.hi = 'hi';
    return param;
  };
  const result1 = ctx.execute(1);
  const result2 = ctx.execute(2);
  t.deepEqual(ctx.state, {hi: 'hi'});
  t.is(result1, 1);
  t.is(result2, 2)
});

test("Sequence for when error occurs in head is 1, -1, 3", t => {
  const ctx = ContextManager.new_();
  const actual = [];
  let expected;
  expected = [1, -1, 3];
  ctx.head = function () {
    actual.push(1);
    throw new Error("Yikes!");
  };
  ctx.tail = function () {
    actual.push(3);
  };
  ctx.error = function (err) {
    actual.push(-1);
    return null;
  };
  ctx.with(function () {
    actual.push(2);
  });
  t.deepEqual(actual, expected);
});

test("Sequence for when error occurs in body is 1, 2, -1, 3", t => {
  const ctx = ContextManager.new_();
  const actual = [];
  let expected;
  expected = [1, 2, -1, 3];
  ctx.head = function () {
    actual.push(1);
  };
  ctx.body = function () {
    actual.push(2);
    throw new Error("error");
  };
  ctx.tail = function () {
    actual.push(3);
  };
  ctx.error = function (err) {
    actual.push(-1);
    return null;
  };
  ctx.execute();
  t.deepEqual(actual, expected);
});

test("this keyword holds state, is available via state property", t => {
  const ctx = ContextManager.new_();
  ctx.body = function () {
    this.hi = 'hi'
  };
  ctx.execute();
  let actual = ctx.state;
  let expected = {hi: 'hi'};
  t.deepEqual(actual, expected);
});

test("pass array as state to contructor", t => {
  const ctx = ContextManager.new_({ state: [] });
  ctx.head = function () {
    this.push(1);
  };
  ctx.body = function (num) {
    this.push(1 + num);
    return this;
  };
  ctx.tail = function () {
    this.push(3);
  };
  const actual = ctx.execute(1);
  t.deepEqual(actual, [1, 2, 3])
});

test("state can be set, if null reverts to the default object", t => {
  const ctx = ContextManager.new_();
  ctx.state = [];
  ctx.with(function () {
    this.push(1);
  });
  let actual = ctx.state;
  let expected = [1];
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

test("default error handler does not swallow error in head", t => {
  const ctx = ContextManager.new_();
  ctx.head = function () {
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

test("Saves state between head and tail calls, return this", t => {
  let ctx = new ContextManager();
  ctx.head = function () {
    this.log = [];
    this.log.push('heading');
  };
  ctx.tail = function () {
    this.log.push('tailing');
  };

  let actual = ctx.with(function () {
    this.log.push('inside body');
    return this;
  });
  let expected = {log:['heading', 'inside body', 'tailing']};
  t.deepEqual(actual, expected);
});

test("param property is passed to with method as parameter", t => {
  const ctx = new ContextManager();
  const p = "param";
  ctx.param = p;
  ctx.with(function  (param) {
    this.param = param;
  });
  let actual = ctx.state;
  let expected = {param:p};
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
  const ctx = ContextManager.withWaitLock(300, dependencies);
  ctx.body = function () {
    return expected;
  };
  const actual = ctx.execute();
  t.is(actual, expected);

  dependencies.LockService_ = MockedLockServiceThrows;
  t.throws(function () {
    const ctx = ContextManager.withWaitLock(300, dependencies);
    ctx.with(function () {
        // nothing
    });
  }, {instanceOf: Error});
});

