/**
 * @param {any[]} params
 */
function create(...params) {
    return Import.ContextManager.new_(...params);
}

/**
 * @param {any[]} params
 */
function usingWaitLock(...params) {
    return Import.ContextManager.usingWaitLock(...params);
}
