import test from 'ava';
import {ContextManager} from '../src/modules/ContextManager.js';

test("Sequence for when error occurs in head is 1, -1, 3", t => {
  const ctx = ContextManager.create();
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
  const ctx = ContextManager.create();
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

test("Sequence for when error occurs in tail is 1, 2, 3, -1", t => {
  const ctx = ContextManager.create();
  const actual = [];
  let expected;
  expected = [1, 2, 3, -1];
  ctx.head = function () {
    actual.push(1);
  };
  ctx.body = function () {
    actual.push(2);
  };
  ctx.tail = function () {
    actual.push(3);
    throw new Error("error");
  };
  ctx.error = function (err) {
    actual.push(-1);
    return null;
  };
  ctx.execute();
  t.deepEqual(actual, expected);
});
