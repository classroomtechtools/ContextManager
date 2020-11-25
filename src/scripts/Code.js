/**
 * @param {Object} [state]
 * @param {Object} [dependencies]
 * @return Context
 */
function create(state=null, dependencies={}) {
    return Import.ContextManager.new_({state:state}, dependencies);
}

/**
 * @param {Number} timeout
 */
function usingWaitLock(timeout) {
    return Import.ContextManager.usingWaitLock(...params);
}

/**
 * @return ContextManager
 */
function lib() {

}
