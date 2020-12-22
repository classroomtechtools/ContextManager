
// private stuff
const _callbacks_ = Symbol('callbacks');
const _state_ = Symbol('state');

const parseSettings = function (opt) {
  opt = opt || {};
  opt.param = opt.param || null;
  opt.head = opt.head || function () {};
  opt.body = opt.body || function () {};
  opt.tail = opt.tail || function () {};
  opt.error = opt.error || function (err) {};
  return opt;
}

export class ContextManager {

  constructor ({ state=null, callbacks={} }={}) {
    // setters will use the symbol properties to set accordingly
    this.callbacks = callbacks;
    this.state = state;
  }

  static create (...params) {
    return new ContextManager(...params);
  }

  static usingWaitLock({timeout=500,
                        guard="getScriptLock", ...e1}={}, {
                        Lock_Service= LockService, ...e2
                       }={})
  {
    const extra = Object.assign(e1, e2);
    if (Object.keys(extra).length > 0) throw TypeError("Invalid param passed. One of these: " + Object.keys(extra).join(', '));
    if (['script', 'document', 'user'].includes(guard.toLowerCase())) {
      guard = 'get' + guard.charAt(0).toUpperCase() + guard.substr(1).toLowerCase() + 'Lock';
    }
    if (!['getScriptLock', 'getDocumentLock', 'getUserLock'].includes(guard)) {
      throw TypeError(`No such guard ${guard}`);
    };

    const ctx = new ContextManager();
    ctx.head = function () {
        this.lock = Lock_Service[guard]();
        this.lock.waitLock(timeout);
    };

    ctx.tail = function () {
        this.lock.releaseLock();
    };

    ctx.error = (err) => {
      //swallow the error
      //return null;
    };

    return ctx;
  }

  // set body (func) {
  //   this[_callbacks_]._body = func;
  // }

  set head (func) {
    this[_callbacks_].head = func;
  }

  set tail (func) {
    this[_callbacks_].tail = func;
  }

  set error (func) {
    this[_callbacks_].error = func;
  }

  set param (obj) {
    this[_callbacks_].param = obj;
  }

  get state () {
    return this[_state_];
  }

  set state (obj) {
    // expose the state property so that it can be set
    this[_state_] = obj === null ? this.defaultObject() : obj;
  }

  set callbacks (obj) {
    this[_callbacks_] = parseSettings(obj);
  }


  defaultObject () {
    return {};
  }

  set body (func) {
    this[_callbacks_].body = func;
  }

  execute (param) {
    const callbacks = this[_callbacks_];
    if (!callbacks.body) throw new Error("Body method for context has not been defined");
    callbacks.param = param;

    // return the result of "with(function () { }) where the body is the function"
    return this.with(callbacks.body);
  }

  dispatchError (err) {
    // error handler can return null to indicate it should be swallowed
    return this[_callbacks_].error.call(this[_state_], err) === null;
  }

  /**
   * Main engine of the context manager
   */
  with (func) {
    let   result = undefined,
          state = this[_state_];
    const callbacks = this[_callbacks_];

    // if state has already been defined (by manually setting), let it be, otherwise
    // set to the default object (which is an object)
    // defaultObject can be overwritten at class level in case programmer wants to
    state = state ? state : this.defaultObject();

    try {

      callbacks.head.call(state, callbacks.param);
      result = func.call(state, callbacks.param);

    } catch (err) {
      // execute the error handler

      if (!this.dispatchError(err))
        throw err;
      else
        result = err;

    } finally {

      // execute the tail
      try {

        callbacks.tail.call(state, callbacks.param);

      } catch (err) {

        if (!this.dispatchError(err))
          throw err;
        else {
          // make copy of err and result so we don't end up nesting it
          result = Object.assign(err, {"ctx.body.result": result});
        }

      }

    }

    return result;
  }
}
