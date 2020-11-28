import test from 'ava';
import {ContextManager} from '../src/modules/ContextManager.js';

test("default error handler does not swallow error", t => {
  const ctx = ContextManager.create();
  t.throws(function () {
    ctx.with(function () {
      throw new Error("Error");
    });
  }, {instanceOf:Error});
});

test("default error handler does not swallow error in head", t => {
  const ctx = ContextManager.create();
  ctx.head = function () {
    throw new Error("Yikes");
  }
  t.throws(function () {
    ctx.exectute();
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

test("if error occurs in head, body, or tail and is swallowed, the error obj is returned", t => {
  const ctx = ContextManager.create();
  ctx.body = function () {
    throw new Error("Returns");
  }
  ctx.error = () => null;
  let result = ctx.execute();
  t.is("Returns", result.message);

  ctx.head = function () {
    throw new Error("Returns");
  }
  result = ctx.execute();
  t.is("Returns", result.message);

  ctx.head = function () {

  };
  ctx.body = function () {
    return "hey"
  };
  ctx.tail = function () {
    throw new Error("Returns");
  }
  result = ctx.execute();
  t.is("Returns", result.message);
  t.is("hey", result["ctx.body.result"]);
});


test("if error occurs in tail but body returned something, " +
     "it can be found in returned error as result property", t => {
  const ctx = ContextManager.create();
  ctx.tail = function () {
    throw new Error("Returns");
  };
  ctx.body = function () {};
  ctx.error = () => null;
  let result = ctx.execute();
  t.is("Returns", result.message);
});
