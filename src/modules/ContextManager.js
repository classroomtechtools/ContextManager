
// private stuff
const _settings_ = Symbol('settings');
const _state_ = Symbol('state');

const parseSettings = function (opt) {
  opt = opt || {};
  opt.param = opt.param || null;
  opt.enter = opt.enter || function () {};
  opt.exit = opt.exit || function () {};
  opt.error = opt.error || function (err) {};
  opt.proxy = opt.proxy || false;
  return opt;
}

export class ContextManager {

  constructor (settings={}) {
    // default settings
    this[_settings_] = parseSettings(settings);
  }

  static new_ (...params) {
    return new ContextManager(...params);
  }

  static withWaitLock(timeout, {
                                guard="getScriptLock",
                                LockService_= LockService,
                                SpreadsheetApp_= SpreadsheetApp
                                }={}) {
    const ctx = new ContextManager();
    if (!['getScriptLock', 'getDocumentLock', 'getUserLock'].includes(guard)) {
      throw TypeError(`No such guard ${guard}`);
    };

    ctx.enter = function () {
        this.lock = LockService_[guard]();
        this.lock.waitLock(timeout);
    };

    ctx.exit = function () {
        SpreadsheetApp_.flush();
        this.lock.releaseLock();
    };

    ctx.error = (err) => {
      console.log(err);
      return null;
    };

    return ctx.with.bind(ctx);
  }

  get settings () {
    return this[_settings_];
  }

  set enter (func) {
    this[_settings_].enter = func;
  }

  set exit (func) {
    this[_settings_].exit = func;
  }

  set error (func) {
    this[_settings_].error = func;
  }

  set param (obj) {
    this[_settings_].param = obj;
  }

  set state (obj) {
    if (obj === null)
      this[_state_] = this.defaultObject;
    else
      this[_state_] = obj;
  }

  get state () {
    return this[_state_];
  }

  defaultObject () {
    return {};
  }

  with (func) {
    var param, result, state;

    this[_state_] = state = this.defaultObject();

    // get the parameter
    param = this[_settings_].param;

    // execute the enter function
    this[_settings_].enter.call(state);

    try {

      // bind it so we can access via `this`        // execute the body
      result = func.call(state, param);

    } catch (err) {
      // execute the error handler
      // error handler can return null to indicate it should be swallowed
      let swallow = this[_settings_].error.call(state, err) === null;

      // if error happened, call error function
      // if it returns null swallow it, otherwise reraise
      if (!swallow)
        throw (err);

    } finally {

      // execute the exit
      this[_settings_].exit.call(state);
    }

    return result;
  }
}
