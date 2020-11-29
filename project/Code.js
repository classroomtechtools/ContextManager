/**
 * Creates a context manager, able to define head, body, and tail functions as properties
 *
 * @param {Object} [state]
 * @param {Object} [settings]
 * @return ContextManager
 */
function create(state=null, settings={}) {
    return Import.ContextManager.create({state, settings});
}

/**
 * Creates a context manager useful for using lock service in tandem with spreadsheet services
 *
 * @param {Number} [timeout]
 * @param {String} [guard]
 * @param {Object} [dependencies]
 * @return Context
 */
function usingWaitLock(timeout=500, guard="getScriptLock", dependencies={}) {
    return Import.ContextManager.usingWaitLock({timeout, guard}, dependencies);
}

/**
 * @return ContextManager
 */
function lib() {
    return Import.ContextManager;
}
