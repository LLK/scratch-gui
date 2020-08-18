const SET_WORKSPACE_METRICS = 'scratch-gui/workspace-metrics/SET_WORKSPACE_METRICS';

const initialState = {};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_WORKSPACE_METRICS:
        return Object.assign({}, state, {
            ...state,
            [action.targetId]: {
                scrollX: action.metrics.scrollX,
                scrollY: action.metrics.scrollY,
                scale: action.metrics.scale
            }
        });
    default:
        return state;
    }
};

const setWorkspaceMetrics = function (targetId, metrics) {
    return {
        type: SET_WORKSPACE_METRICS,
        targetId: targetId,
        metrics: metrics
    };
};

export {
    reducer as default,
    initialState as workspaceMetricsInitialState,
    setWorkspaceMetrics
};
