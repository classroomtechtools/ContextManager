/**
 * The default identifier for this Google AppScripts library.
 * @fileOverview ContextManager
 * @author Adam Morris <classroomtechtools.ctt@gmail.com>
 * @license MIT
 *
 */


/**
 * @typedef Context
 * @class
 * A `Context` instance is the primary object for this library; it is usually instantiated by calling {@link create `create`}. Callbacks are available on this object that define  behaviour when invoked with {@link execute `execute`}.
 *
 * Inside each of the callbacks, the `this` keyword can be used to maintain state. After calling `execute` the `state` property will hold this state.
 *
 * **Note:** The programmer has the option of defining callbacks on the `callbacks` object "inline" in the `create` function directly, and/or defining them via "declaration" after `create` has returned. Declared callbacks will overwrite inline callbacks.
 *
 * @param {object} [obj={}] - The object for destructuring
 * @param {any} [obj.state={}] - The initial state of `this` in callbacks
 * @param {object} [obj.callbacks={}] - Optionally define the callbacks inline
 * @param {bodyCallback} [obj.callbacks.body] same as body property below
 * @param {headTailCallback} [obj.callbacks.head] same as head property below
 * @param {headTailCallback} [obj.callbacks.tail] same as tail property below
 * @param {errorCallback} [obj.callbacks.error] same as error property below
 * @property {bodyCallback} body - function that does the main work, but which needs code that sets up or prepares before executing, and/or needs code that tears down or completes. {@link module:ContextManager.bodyCallback doc}
 * @property {headTailCallback} head - callback that does the set up or preparation.
 * @property {headTailCallback} tail - callback that does the tear down or post
 * @property {errorCallback} error - block of code that is invoked upon error occurring. By default does nothing. If defined and returns `null` then the context will "swallow" the error. Accepts one parameter, the `Error` object {@link Context~error error callback doc}
 * @property {Function} execute - invokes the `head` (if present), then `body`, then `tail` (if present) functions, in that order, even if an error occurs.
 * @property {any} state - holds state, represented by `this` inside functions `body`, `head`, and `tail`
 *
 * @example
 * // create a context which has `object` as initial state
 * const context = ContextManager.create()
 * context.head = function (param) {
 *     this.value = param
 * };
 * context.body = function (param) {
 *     Logger.log(this);
 * }
 * context.execute('value');  // outputs {value: 'value'}
 *
 * @example
 * // same as above, except with callbacks
 * const context = ContextManager.create({}, {
 *     head: function (param) {
 *         this.value = param;
 *     },
 *     body: function (param) {
 *         Logger.log(this);
 *     }
 * });
 * context.execute('value');  // outputs {value: 'value'}
 *
 * @example
 * // creates a context where state is an array
 * const context = ContextManager.create([]);  // send array as first parameter
 * context.head = function (param) {
 *     this.push(param - 1)
 * };
 * context.body = function (param) {
 *     this.push(param);
 * }
 * context.tail = function (param) {
 *     this.push(param + 1);
 * }
 * context.execute(2);
 * Logger.log(context.state);  // [1, 2, 3]
 */




/**
 * Creates and returns a context object
 *
 * @param {any} [state={}] - the initial value of the context's `state` property available as `this` in callbacks
 * @param {object} [callbacks={}]
 * @param {bodyCallback} [callbacks.body] - see callback
 * @param {headTailCallback} [callbacks.head] - see callback
 * @param {headTailCallback} [callbacks.tail] - see callback
 * @param {errorCallback} [callbacks.tail] - see callback
 * @returns {Context}
 *
 * @see https://classroomtechtools.github.io/ContextManager/global.html#create
 */
function create() {
    const state = arguments[0] || {};
    const callbacks = arguments[1] || {};
    return Import.ContextManager.create({state, callbacks});
}

/**
 * A convenience function that creates and executes a context. See `create` for parameter callbacks specification. Since it executes immediately, `callbacks` and `callbacks.body` is required.
 * @param {object} obj - The object to be destructured
 * @param {any} [obj.param=null] - The parameter to pass on to callbacks
 * @param {any} [obj.state={}] - Initial state
 * @param {object} obj.callbacks - Callback, which at least must have body defined
 * @param {bodyCallback} obj.callbacks.body - body callback
 * @returns {any}
 * @see https://classroomtechtools.github.io/ContextManager/global.html#execute
 */
function execute({param=null, state={}, callbacks={body:()=>null}}) {
    return Import.ContextManager.create({state, callbacks}).execute(param);
}

/**
 * Creates a context manager with predefined `head` and `tail`, useful for using lock service in tandem with spreadsheet services
 *
 * @param {Number} [timeout] - the parameter passed to `waitLock` in the `head` method
 * @param {String} [guard] - a "guard" is referring to {@link https://developers.google.com/apps-script/reference/lock/lock-service#methods methods of `LockService`}; value of `user` converts to `getUserLock`, `script` converts to `getScriptLock` and `document` converts to `getDocumentLock`
 * @param {Object} [dependencies] - For mock tests using dependency injection
 * @param {Object} dependencies.Lock_Service - for mocking `.getScriptLock` and `.waitLock`
 * @returns {Context}
 * @see https://classroomtechtools.github.io/ContextManager/global.html#usingWaitLock
 * @example
 * // same as this:
 * const ctx = ContextManager.usingWaitLock(500, 'script');
 * ctx.body = function (param) {
 *   // do your work here
 *   return param + 1;
 * };
 * // run it
 * // first creates lock for you with timeout of 500
 * // then executes your body function above
 * // then releases lock for you
 * const result = ctx.execute(1);  X
 * Logger.log(result);  // 2
 *
 */
function usingWaitLock() {
    const timeout = arguments[0] || 500;
    const guard = arguments[1] || 'script';
    const dependencies = arguments[2] || {};
    return Import.ContextManager.usingWaitLock({timeout, guard}, dependencies);
}

/**
 * Returns the class for advanced usage patterns
 *
 * @example
 * // get the class object so we can potentially override functionality
 * const Context = ContextManager.klass();
 * class MyContext(Context) {
    ...
 * }
 * const context = new MyContext();
 * @returns {ContextManager}
 */
function klass() {
    return Import.ContextManager;
}


/**
 * The body callback for an instance of Context. The value returned via the return value of `execute`. State can be changed by using the `this` property.
 *
 * **NOTE:** If this callback is defined as an arrow function, `this` will be undefined
 *
 * @callback bodyCallback
 * @param {any} [param] - the value passed to from `execute`
 * @returns {any}
 *
 * @example
 * const context = ContextManager.create();
 * context.body = function (param) {
 *     Logger.log(param);
 * };
 * context.execute('hello from body callback');
 */

/**
 * The head or tail callback for an instance of Context. The value returned is ignored and has no effect. State can be changed by using the `this` property.
 *
 * **NOTE:** If this callback is defined as an arrow function, `this` will be undefined
 *
 * @callback headTailCallback
 * @param {any} [param] - the value passed to from `execute`
 * @returns {void}
 */

/**
 * The error callback is invoked whenever an error is encountered in the head, body, or tail callbacks of an instance of Context. Returning `null` will swallow the error, and the error object will be returned via `execute`. If the body was executed and returned before the error was encountered, the body's result is available via the `ctx.body.result` property on the Error object.
 *
 * @callback errorCallback
 * @param {Error} error - The error object that was encountered
 * @returns {any}
 * @example
 * // defining an error callback and returning `null` instructs the context to not re-raise it, to "swallow" it
 * const context = ContextManager.create();
 * context.error = function (err) {
 *     return null;
 * };
 * context.body = function (param) {
 *     if (param === "bad")
 *         throw new Error("some fake error");
 * };
 * const result = context.execute("bad");
 * result instanceof Error;  // true
 * result.message;  // "some fake error"
 *
 */
