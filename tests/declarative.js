import test from 'ava';
import {ContextManager} from '../src/modules/ContextManager.js';

test("set context.body and context.execute for multiple invocations", t => {
  const ctx = ContextManager.create();
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

test("this keyword holds state, is available via state property", t => {
  const ctx = ContextManager.create();
  ctx.body = function () {
    this.hi = 'hi'
  };
  ctx.execute();
  let actual = ctx.state;
  let expected = {hi: 'hi'};
  t.deepEqual(actual, expected);
});

test("pass array as state to contructor", t => {
  const ctx = ContextManager.create({ state: [] });
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
  const ctx = ContextManager.create();
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
    SSA_: MockedSS
  };
  const ctx = ContextManager.usingWaitLock({timeout: 300}, dependencies);
  ctx.body = function () {
    return expected;
  };
  const actual = ctx.execute();
  t.is(actual, expected);

  dependencies.LockService_ = MockedLockServiceThrows;
  t.throws(function () {
    const ctx = ContextManager.usingWaitLock(300, dependencies);
    ctx.with(function () {
        // nothing
    });
  }, {instanceOf: Error});
});

test("param is sent to head, body, and tail", t => {
  const ctx = ContextManager.create({state: []});
  const func = function (param) {
    this.push(param);
  }
  ctx.head = func;
  ctx.body = func;
  ctx.tail = func;
  ctx.execute('p');
  t.deepEqual(ctx.state, ['p', 'p', 'p']);
});

