/**
 * @param {Object} [state]
 * @param {Object} [dependencies]
 * @return Context
 */
function create(state=null, dependencies={}) {
    return Import.ContextManager.create({state}, dependencies);
}

/**
 * @param {Number} [timeout]
 * @param {String} [guard]
 */
function usingWaitLock(timeout=500, guard="getScriptLock") {
    return Import.ContextManager.usingWaitLock({timeout}, {guard});
}

/**
 * @return ContextManager
 */
function lib() {
    return Import.ContextManager;
}
