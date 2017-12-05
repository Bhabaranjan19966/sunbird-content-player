/**
 * Telemetry V3 Library
 * @author Akash Gupta <Akash.Gupta@tarento.com>
 */

var EkTelemetry = (function() {
    this.ektelemetry = function() {};
    var instance = function() {};
    var telemetryInstance = this;
    this.ektelemetry.initialized = false;
    this.ektelemetry.config = undefined;
    this.ektelemetry._version = "3.0";
    dispatcher = undefined;

    this.startTime = 0;
    this._defaultValue = {
        pdata: {
            id: "in.ekstep",
            ver: "1.0",
            pid: ""
        },
        channel: "in.ekstep",
        uid: "anonymous",
        did: "",
        authtoken: "",
        sid: "",
        batchsize: 20,
        host: "https://api.ekstep.in",
        endpoint: "/data/v3/telemetry",
        tags: [],
        cdata: [],
        apislug: "/action"
    },
    this.deviceSpecRequiredFields = ["os","make","id","mem","idisk","edisk","scrn","camera","cpu","sims","cap"],
    this.userAgentRequiredFields = ["agent","ver","system","platform","raw"],
    this.objectRequiredFields = ["id","type","ver"],
    this.targetRequiredFields = ["id","type","ver"],
    this.pluginRequiredFields = ["id","ver"],
    this.visitRequiredFields = ["objid","objtype"],
    this.questionRequiredFields = ["id","maxscore","exlength","desc","title"],
    this.pdataRequiredFields = ["id"],
    this.targetObjectRequiredFields = ["type","id"],

    this.ektelemetry.start = function(config, contentId, contentVer, data) {
        if (EkTelemetry.initialized) {
            console.log("Telemetry is already initialized..");
            return;
        }
        if (!instance.hasRequiredData(data, ["type"])) {
            console.error('Invalid start data');
            return;
        }
        if (data.dspec && !instance.checkRequiredField(data.dspec, telemetryInstance.deviceSpecRequiredFields)) {
            console.error('Invalid device spec')
            return;
        }
        if (data.uaspec && !instance.checkRequiredField(data.uaspec, telemetryInstance.userAgentRequiredFields)) {
            console.error('Invalid user agent spec')
            return;
        }
        var eksData = {
            "type": data.type,
            "loc": data.loc || "",
            "mode": data.mode || "",
            "duration": data.duration,
            "pageid": (data && data.stageto) ? data.stageto : ""
        }
        if(data.dspec)
            eksData.dspec = data.dspec;
        if(data.uaspec)
            eksData.uaspec = data.uaspec;
        if (instance.init(config, contentId, contentVer, data.type)) {
            var startEventObj = instance.getEvent('START', eksData);
            instance._dispatch(startEventObj)

            // Required to calculate the time spent of content while generating OE_END
            EkTelemetry.startTime = startEventObj.ets;
            return startEventObj;
        }
    }

    this.ektelemetry.end = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        if (!instance.hasRequiredData(data, ["type", "pageid"])) {
            console.error('Invalid end data. Required fields are missing.', data);
            return;
        }
        var eksData = {
            "type": data.type,
            "mode": data.mode || '',
            "duration" : ((new Date()).getTime() - EkTelemetry.startTime),
            "pageid": (data && data.stageto) ? data.stageto : "",
            "summary": data.summary || ''
        } 
        instance._dispatch(instance.getEvent('END', eksData));
        EkTelemetry.initialized = false;
    }

    this.ektelemetry.impression = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        if (undefined == data.pageid || undefined == data.type || undefined == data.uri) {
            console.error('Invalid impression data. Required fields are missing.', data);
            return;
        }
        if (data.visits && !instance.checkRequiredField(data.visits, telemetryInstance.visitRequiredFields)) {
            console.error('Invalid visits spec')
            return;
        }
        instance._dispatch(instance.getEvent('IMPRESSION', data));
    }

    this.ektelemetry.interact = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        if (!instance.hasRequiredData(data, ["type", "id"])) {
            console.error('Invalid interact data');
            return;
        }
        if (data.target && !instance.checkRequiredField(data.target, telemetryInstance.targetRequiredFields)) {
            console.error('Invalid target spec')
            return;
        }
        if (data.plugin && !instance.checkRequiredField(data.plugin, telemetryInstance.pluginRequiredFields)) {
            console.error('Invalid plugin spec')
            return;
        }

        instance._dispatch(instance.getEvent('INTERACT', data));
    }

    this.ektelemetry.assess = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        if (!instance.hasRequiredData(data, ["item", "pass", "score", "resvalues", "duration"])) {
            console.error('Invalid assess data');
            return;
        }
        if (!instance.checkRequiredField(data.item, telemetryInstance.questionRequiredFields)) {
            console.error('Invalid question spec')
            return;
        }
        var eksData = {
            "item": data.item,
            "index": data.index || '',
            "pass": data.pass || 'No',
            "score": data.score || 0,
            "resvalues": data.resvalues,
            "duration": data.duration
        }
        instance._dispatch(instance.getEvent('ASSESS', eksData));
    }

    this.ektelemetry.response = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        if (!instance.hasRequiredData(data, ["target", "values", "type"])) {
            console.error('Invalid response data');
            return;
        }
        if (!instance.checkRequiredField(data.target, telemetryInstance.targetRequiredFields)) {
            console.error('Invalid target spec')
            return;
        }
        var eksData = {
            "target": data.target,
            "type": data.type,
            "values": data.values
        }
        instance._dispatch(instance.getEvent('RESPONSE', eksData));
    }

    this.ektelemetry.interrupt = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        if (!instance.hasRequiredData(data, ["type"])) {
            console.error('Invalid interrupt data');
            return;
        }
        var eksData = {
            "type": data.type,
            "pageid": data.stageid || ''
        }
        instance._dispatch(instance.getEvent('INTERRUPT', eksData));
    }

    this.ektelemetry.feedback = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        var eksData = {
            "rating": data.rating || '',
            "comments": data.comments || ''
        }
        instance._dispatch(instance.getEvent('FEEDBACK', eksData));
    }

    //Share
    this.ektelemetry.share = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        if (!instance.hasRequiredData(data, ["items"])) {
            console.error('Invalid share data');
            return;
        }
        var eksData = {
            "dir": data.dir || '',
            "type": data.type || '',
            "items": data.items
        }
        instance._dispatch(instance.getEvent('INTERRUPT', eksData));
    }

    this.ektelemetry.audit = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        if (!instance.hasRequiredData(data, ["props"])) {
            console.error('Invalid audit data');
            return;
        }
        var eksData = {
            "props": data.props,
            "state": data.state || '',
            "prevstate": data.prevstate || ''
        }
        instance._dispatch(instance.getEvent('AUDIT', eksData));
    }

    this.ektelemetry.error = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        if (!instance.hasRequiredData(data, ["err", "errtype", "stacktrace"])) {
            console.error('Invalid error data');
            return;
        }
        if (data.object && !instance.checkRequiredField(data.object, telemetryInstance.objectRequiredFields)) {
            console.error('Invalid object spec')
            return;
        }
        if (data.plugin && !instance.checkRequiredField(data.plugin, telemetryInstance.pluginRequiredFields)) {
            console.error('Invalid plugin spec')
            return;
        }
        var eksData = {
            "err": data.err,
            "errtype": data.errtype,
            "stacktrace": data.stacktrace,
            "pageid": data.stageId || '',
            "object": data.object || '',
            "plugin": data.plugin || ''
        }
        instance._dispatch(instance.getEvent('ERROR', eksData));
    }

    this.ektelemetry.heartbeat = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        instance._dispatch(instance.getEvent('HEARTBEAT', data));
    }

    this.ektelemetry.log = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        if (!instance.hasRequiredData(data, ["type", "level", "message"])) {
            console.error('Invalid log data');
            return;
        }
        var eksData = {
            "type": data.type,
            "level": data.level,
            "message": data.message,
            "pageid": data.stageid || '',
            "params": data.params || ''
        }
        instance._dispatch(instance.getEvent('LOG', eksData));
    }

    this.ektelemetry.search = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        if (!instance.hasRequiredData(data, ["query", "size", "topn"])) {
            console.error('Invalid search data');
            return;
        }
        var eksData = {
            "type": data.type || '',
            "query": data.query,
            "filters": data.filters || {},
            "sort": data.sort || {},
            "correlationid": data.correlationid || "",
            "size": data.size,
            "topn": data.type || []
        }
        instance._dispatch(instance.getEvent('SEARCH', eksData));
    }

    this.ektelemetry.metrics = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        instance._dispatch(instance.getEvent('METRICS', data));
    }

    this.ektelemetry.exdata = function(type, data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        var eksData = {
            "type": type || '',
            "data": data || ''
        }
        instance._dispatch(instance.getEvent('EXDATA', eksData));
    }

    this.ektelemetry.summary = function(data) {
        if (!EkTelemetry.initialized) {
            console.log("Telemetry is not initialized, Please start telemetry first");
            return;
        }
        if (!instance.hasRequiredData(data, ["type", "starttime", "endtime", "timespent","pageviews","interactions"])) {
            console.error('Invalid summary data');
            return;
        }
        var eksData = {
            "type": data.type,
            "mode": data.mode || '',
            "starttime": data.starttime,
            "endtime": data.endtime,
            "timespent": data.timespent,
            "pageviews": data.pageviews,
            "interactions": data.interactions,
            "envsummary": data.envsummary || [],
            "eventssummary": data.eventssummary || [],
            "pagesummary": data.pagesummary || []
        }
        instance._dispatch(instance.getEvent('SUMMARY', eksData));
    }    

    instance.init = function(config, contentId, contentVer, type) {
        if (EkTelemetry.initialized) {
            console.log("Telemetry is already initialized..");
            return;
        }
        if (config.pdata && !instance.checkRequiredField(config.pdata, telemetryInstance.pdataRequiredFields)) {
            console.error('Invalid pdata spec in config')
            return;
        }
        if (config.object && !instance.checkRequiredField(config.object, telemetryInstance.targetObjectRequiredFields)) {
            console.error('Invalid target object spec in config')
            return;
        }

        var requiredData = Object.assign(config, { "contentId": contentId, "contentVer": contentVer, "type": type });

        if (!instance.hasRequiredData(requiredData, ["contentId", "contentVer", "pdata", "channel", "uid", "env"])) {
            console.error('Invalid start data');
            EkTelemetry.initialized = false;
            return EkTelemetry.initialized;
        }

        _defaultValue.gdata = {
            "id": contentId,
            "ver": contentVer
        }
        config.batchsize = config.batchsize ? (config.batchsize < 10 ? 10 : (config.batchsize > 1000 ? 1000 : config.batchsize)) : _defaultValue.batchsize;
        EkTelemetry.config = Object.assign(_defaultValue, config);
        EkTelemetry.initialized = true;
        dispatcher = EkTelemetry.config.dispatcher ? EkTelemetry.config.dispatcher : libraryDispatcher;
        return EkTelemetry.initialized;
    }

    instance._dispatch = function(message) {
        if (EkTelemetry.initialized) {
            message.mid = message.eid + ':' + CryptoJS.MD5(JSON.stringify(message)).toString();
            dispatcher.dispatch(message);
        }
    }

    instance.getEvent = function(eventId, data) {
        var eventObj = {
            "eid": eventId,
            "ets": (new Date()).getTime(),
            "ver": EkTelemetry._version,
            "mid": '',
            "actor": {
                "id": EkTelemetry.config.uid,
                "type": 'User'
            },
            "context": {
                "channel": EkTelemetry.config.channel,
                "pdata": EkTelemetry.config.pdata,
                "env": EkTelemetry.config.env,
                "sid": EkTelemetry.config.sid,
                "did": EkTelemetry.config.did,
                "cdata": EkTelemetry.config.cdata, //TODO: No correlation data as of now. Needs to be sent by portal in context
                "rollup": EkTelemetry.config.rollup || {}
            },
            "object": EkTelemetry.config.object,
            "tags": EkTelemetry.config.tags,
            "edata": data
        }
        return eventObj;
    }

    // instance.addEvent = function(telemetryEvent) {
    //     if (EkTelemetry.initialized) {
    //         telemetryEvent.mid = telemetryEvent.eid + '_' + CryptoJS.MD5(JSON.stringify(telemetryEvent)).toString();
    //         var customEvent = new CustomEvent('TelemetryEvent', { detail: telemetryEvent });
    //         console.log("Telemetry Event ", telemetryEvent);
    //         document.dispatchEvent(customEvent);
    //     } else {
    //         console.log("Telemetry is not initialized. Please start Telemetry to log events.");
    //     }
    // }

    instance.hasRequiredData = function(data, mandatoryFields) {
        var isValid = true;
        mandatoryFields.forEach(function(key) {
            if (!data.hasOwnProperty(key)) isValid = false;
        });
        return isValid;
    }

    instance.checkRequiredField = function(data, defaultKeys) {
        var returnValue = true;
        defaultKeys.forEach(function(key) {
            if (!data.hasOwnProperty(key)) {
                returnValue = false
            }
        })
        return returnValue;
    }

    // For device which dont support ECMAScript 6
    instance.objectAssign = function() {
        Object.assign = function(target) {
            'use strict';
            if (target == null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }

            target = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var source = arguments[index];
                if (source != null) {
                    for (var key in source) {
                        if (Object.prototype.hasOwnProperty.call(source, key)) {
                            target[key] = source[key];
                        }
                    }
                }
            }
            return target;
        }
    }

    if (typeof Object.assign != 'function') {
        instance.objectAssign();
    }

    return this.ektelemetry;
})();

var libraryDispatcher = {
    dispatch: function(event){
        var customEvent = new CustomEvent('TelemetryEvent', { detail: event });
        console.log("Telemetry Event ", event);
        document.dispatchEvent(customEvent);
    }
};