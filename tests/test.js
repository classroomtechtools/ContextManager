import test from 'ava';
import {ContextManager} from '../index.js';

test(".state saves and is available after execution", t => {
  let ctx = new ContextManager();
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

test("error handler receives error and can swallow error", t => {
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

test("Can be passed a parameter", t => {
  let ctx = new ContextManager();
  const param = "param";
  ctx.param = param;
  ctx.with(function  (param) {
    this.param = param;
  });
  let actual = ctx.state;
  let expected = {param:param};
  t.deepEqual(actual, expected);
});
