/**
 * @param {Object} [state]
 * @param {Object} [dependencies]
 * @return Context
 */
function create(state=null, settings={}) {
    Logger.log(state);
    return Import.ContextManager.create({state, settings});
}

/**
 * @param {Number} [timeout]
 * @param {String} [guard]
 */
function usingWaitLock(timeout=500, guard="getScriptLock", dependencies={}) {
    return Import.ContextManager.usingWaitLock({timeout}, {guard}, dependencies);
}

/**
 * @return ContextManager
 */
function lib() {
    return Import.ContextManager;
}
