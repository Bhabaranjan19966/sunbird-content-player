function newPlugin() {
    ShapePluginExt = ShapePlugin.extend({});
    PluginManager.registerPlugin('shapeext', ShapePluginExt);
    return ShapePluginExt;
}

function invokePlugin(data) {
    var parent = {
        dimensions: function() {
            return {
                x: 0,
                y: 0,
                w: 500,
                h: 500
            }
        },
        addChild: function() {}
    }
    data = data || {
        "event": [{
            "action": {
                "type": "command",
                "command": "show",
                "asset": "testShape"
            },
            "type": "click"
        }, {
            "action": {
                "type": "command",
                "command": "toggleShow",
                "asset": "testShape"
            },
            "type": "toggle"
        }],
        "type": "rect",
        "x": 87,
        "y": 82,
        "w": 13,
        "h": 18,
        "hitArea": true,
        "id": "testShape"
    };
    return PluginManager.invoke('shapeext', data, parent);
}

function createAndInvokePlugin(data) {
    newPlugin();
    return invokePlugin(data);
}

function startRenderer(data) {
    var fixture = setFixtures('<div id="gameArea"><canvas id="gameCanvas" width="1366" height="768"></canvas></div>');
    Renderer.start("", "gameCanvas", {}, data);
}