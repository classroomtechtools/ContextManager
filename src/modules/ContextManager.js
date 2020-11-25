
// private stuff
const _settings_ = Symbol('settings');
const _state_ = Symbol('state');

const parseSettings = function (opt) {
  opt = opt || {};
  opt.param = opt.param || null;
  opt.head = opt.head || function () {};
  opt.tail = opt.tail || function () {};
  opt.error = opt.error || function (err) {};
  return opt;
}

export class ContextManager {

  constructor ({ state=null, settings={} }={}) {
    // setters will use the symbol properties to set accordingly
    this.settings = settings;
    this.state = state;
  }

  static create (...params) {
    return new ContextManager(...params);
  }

  static usingWaitLock({timeout=500}={}, {
                        guard="getScriptLock",
                        LockService_= LockService,
                        SpreadsheetApp_= window['Spreadsheet' + 'App']
                       }={})
  {
    const ctx = new ContextManager();
    if (!['getScriptLock', 'getDocumentLock', 'getUserLock'].includes(guard)) {
      throw TypeError(`No such guard ${guard}`);
    };

    ctx.head = function () {
        this.lock = LockService_[guard]();
        this.lock.waitLock(timeout);
    };

    ctx.tail = function () {
        SpreadsheetApp_.flush();
        this.lock.releaseLock();
    };

    ctx.error = (err) => {
      //swallow the error
      //return null;
    };

    return ctx;
  }

  get settings () {
    return this[_settings_];
  }

  // set body (func) {
  //   this[_settings_]._body = func;
  // }

  set head (func) {
    this[_settings_].head = func;
  }

  set tail (func) {
    this[_settings_].tail = func;
  }

  set error (func) {
    this[_settings_].error = func;
  }

  set param (obj) {
    this[_settings_].param = obj;
  }

  set state (obj) {
    // expose the state property so that it can be set
    this[_state_] = obj === null ? this.defaultObject() : obj;
  }

  set settings (obj) {
    this[_settings_] = parseSettings(obj);
  }

  get state () {
    return this[_state_];
  }

  defaultObject () {
    return {};
  }

  set body (func) {
    this[_settings_].body = func;
  }

  execute (param) {
    if (!this[_settings_].body) throw new Error("Body method for context has not been defined");
    this[_settings_].param = param;
    return this.with(this[_settings_].body);
  }

  dispatchError (err) {
    // error handler can return null to indicate it should be swallowed
    return this[_settings_].error.call(this[_state_], err) === null;
  }


  with (func) {
    let result = undefined;

    // if state has already been defined (by manually setting), let it be, otherwise
    // set to the default object (which is an object)
    // defaultObject can be overwritten at class level in case programmer wants to
    this[_state_] = this[_state_] ? this[_state_] : this.defaultObject();

    try {

      this[_settings_].head.call(this[_state_], this[_settings_].param);
      result = func.call(this[_state_], this[_settings_].param);

    } catch (err) {
      // execute the error handler

      if (!this.dispatchError(err))
        throw err;
      else
        result = err;

    } finally {

      // execute the tail
      try {
        this[_settings_].tail.call(this[_state_], this[_settings_].param);
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
