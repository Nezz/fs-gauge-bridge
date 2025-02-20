var bDebugKeyNavigation = false;
var bDebugKeyNavClearConsole = false;
var bLiveReload = false;
var bAutoReloadCSS = false;
var bDebugListeners = false;
var bDebugCursor = false;
var bDebugElementsCreation = false;
var g_externalVariables = {
    vrMode: false,
    animationsEnabled: true,
};
var ScreenReader;
(function (ScreenReader) {
    class SRRuleEvent {
        constructor() {
            this.__Type = "SRRuleEvent";
        }
    }
    class SRRule {
    }
    class Manager {
        constructor() {
            this.m_waitingEvents = [];
            this.setRules = (rules) => {
                this.m_rules = {};
                for (let rule of rules) {
                    this.m_rules[rule.nodeType] = rule;
                }
                for (let waiting of this.m_waitingEvents) {
                    switch (waiting.event) {
                        case "OnValidate":
                            this.onValidate(waiting.elem);
                            break;
                        case "OnShow":
                            this.onShow(waiting.elem);
                            break;
                        case "OnFocus":
                            this.onFocus(waiting.elem);
                            break;
                    }
                }
                this.m_waitingEvents = [];
            };
            this.askTypeProperties = (type) => {
                let elem = document.createElement(type);
                if (elem) {
                    let out = Object.getPrototypeOf(elem);
                    const getters = Object.entries(Object.getOwnPropertyDescriptors(out))
                        .filter(([key, descriptor]) => typeof descriptor.get === 'function')
                        .map(([key]) => key);
                    this.m_listener.trigger("SET_TYPE_PROPERTIES", type, getters);
                }
            };
        }
        updateStatus() {
            if (this.active)
                this.checkListener();
            else {
                if (this.m_listener)
                    this.m_listener.unregister();
                this.m_listener = null;
            }
        }
        checkListener() {
            if (!this.m_listener) {
                this.m_listener = RegisterViewListener("JS_LISTENER_SCREEN_READER", () => {
                    this.m_listener.trigger("ASK_RULES");
                });
                this.m_listener.on("RulesChanged", this.setRules);
                this.m_listener.on("AskTypeProperties", this.askTypeProperties);
            }
        }
        get active() { return g_externalVariables.useScreenReader === true; }
        forceEvent(nodeName, event) {
            if (this.active === true) {
                this.checkListener();
                this.m_listener.trigger("START_SR_EVENT", nodeName);
                let textToRead = event.text != "" ? this.translateEvent(event.text, null) : "";
                if (textToRead != "")
                    this.m_listener.trigger("CHAIN_SR_EVENT", textToRead, event.delay, event.noCut);
            }
        }
        onFocus(elem) {
            if (!elem.canUseScreenReader())
                return;
            if (this.active === true) {
                this.checkListener();
                let rule = this.m_rules && this.m_rules[elem.nodeName];
                if (rule != null) {
                    this.onEvent(rule.onFocus, elem);
                }
                else {
                    this.onNonExistingRule(elem, "OnFocus");
                }
            }
        }
        translateEvent(eventText, elem) {
            if (eventText) {
                let textToRead = Utils.Translate(eventText.toString()).replace(/\${([a-zA-Z]+)}/g, (substring, content) => {
                    if (elem && content && content != undefined) {
                        let elemToUse = null;
                        if (elem[content] !== undefined)
                            return Utils.Translate(elem[content]);
                        let parent = elem.parentElement;
                        while (parent) {
                            if (parent[content] !== undefined) {
                                elemToUse = parent;
                            }
                            parent = parent.parentElement;
                        }
                        if (elemToUse) {
                            return Utils.Translate(elemToUse[content]);
                        }
                        return substring;
                    }
                    return "";
                });
                return textToRead;
            }
            else
                return "";
        }
        onEvent(events, elem) {
            if (events) {
                this.m_listener.trigger("START_SR_EVENT", elem.nodeName);
                for (let event of events) {
                    let textToRead = event.text != "" ? this.translateEvent(event.text, elem) : "";
                    if (textToRead != "")
                        this.m_listener.trigger("CHAIN_SR_EVENT", textToRead, event.delay, event.noCut);
                }
            }
        }
        onNonExistingRule(elem, event) {
            if (this.m_rules && this.m_listener && this.m_listener.connected) {
                if (g_externalVariables.debugScreenReader) {
                    this.m_listener.trigger("NON_EXISTING_RULE", elem.nodeName);
                }
            }
            else {
                this.m_waitingEvents.push({ elem, event });
            }
        }
        onValidate(elem) {
            if (!elem.canUseScreenReader())
                return;
            if (this.active === true) {
                this.checkListener();
                let rule = this.m_rules && this.m_rules[elem.nodeName];
                if (rule != null) {
                    this.onEvent(rule.onChange, elem);
                }
                else {
                    this.onNonExistingRule(elem, "OnValidate");
                }
            }
        }
        onShow(elem) {
            if (!elem.canUseScreenReader())
                return;
            if (this.active === true) {
                this.checkListener();
                let rule = this.m_rules && this.m_rules[elem.nodeName];
                if (rule != null) {
                    this.onEvent(rule.onShow, elem);
                }
                else {
                    this.onNonExistingRule(elem, "OnShow");
                }
            }
        }
    }
    function forceEvent(nodeName, event) {
        if (g_ScreenReader)
            g_ScreenReader.forceEvent(nodeName, event);
    }
    ScreenReader.forceEvent = forceEvent;
    function onFocus(elem) {
        if (g_ScreenReader)
            g_ScreenReader.onFocus(elem);
    }
    ScreenReader.onFocus = onFocus;
    function onValidate(elem) {
        if (g_ScreenReader)
            g_ScreenReader.onValidate(elem);
    }
    ScreenReader.onValidate = onValidate;
    function updateStatus() {
        if (g_ScreenReader)
            g_ScreenReader.updateStatus();
    }
    ScreenReader.updateStatus = updateStatus;
    function onShow(elem) {
        if (g_ScreenReader)
            g_ScreenReader.onShow(elem);
    }
    ScreenReader.onShow = onShow;
    let g_ScreenReader = null;
    document.addEventListener("DOMContentLoaded", () => {
        if (!document.body.hasAttribute("no-screen-reader"))
            g_ScreenReader = new Manager();
    }, { once: true });
})(ScreenReader || (ScreenReader = {}));
function GameConfiguration() {
    if (window.frameElement) {
        return window.top["gameConfig"];
    }
    return window["gameConfig"];
}
function DEBUG() { return GameConfiguration() === arguments.callee.name; }
function RELEASE() { return GameConfiguration() === arguments.callee.name; }
function MASTER() { return GameConfiguration() === arguments.callee.name; }
function SUBMISSION() { return GameConfiguration() === arguments.callee.name; }
var GAME_CONFIGURATION;
(function (GAME_CONFIGURATION) {
    GAME_CONFIGURATION["DEBUG"] = "DEBUG";
    GAME_CONFIGURATION["RELEASE"] = "RELEASE";
    GAME_CONFIGURATION["MASTER"] = "MASTER";
    GAME_CONFIGURATION["SUBMISSION"] = "SUBMISSION";
})(GAME_CONFIGURATION || (GAME_CONFIGURATION = {}));
const GAME_CONFIGURATION_ORDER = [GAME_CONFIGURATION.DEBUG, GAME_CONFIGURATION.RELEASE, GAME_CONFIGURATION.MASTER, GAME_CONFIGURATION.SUBMISSION];
function GamePlatform() {
    if (window.frameElement) {
        return window.top["gamePlatform"];
    }
    return window["gamePlatform"];
}
function PC() { return GamePlatform() === arguments.callee.name; }
function XBOX() { return GamePlatform() === arguments.callee.name; }
var GAME_PLATFORM;
(function (GAME_PLATFORM) {
    GAME_PLATFORM["PC"] = "PC";
    GAME_PLATFORM["XBOX"] = "XBOX";
})(GAME_PLATFORM || (GAME_PLATFORM = {}));
;
var Logger;
(function (Logger) {
    function trace(...args) {
        if (DEBUG())
            console.log(...args);
    }
    Logger.trace = trace;
    function log(...args) {
        if (DEBUG() || RELEASE())
            console.log(...args);
    }
    Logger.log = log;
    function info(...args) {
        if (DEBUG() || RELEASE())
            console.info(...args);
    }
    Logger.info = info;
    function warn(...args) {
        if (DEBUG() || RELEASE() || MASTER())
            console.warn(...args);
    }
    Logger.warn = warn;
    function error(...args) {
        console.error(...args);
    }
    Logger.error = error;
})(Logger || (Logger = {}));
function GetUIEditionMode() {
    if (window.frameElement) {
        return window.top["UIEditionMode"];
    }
    return window["UIEditionMode"];
}
function UI_USE_DATA_FOLDER() { return window["UIUseDataFolder"] != null; }
function EDITION_MODE() { return GetUIEditionMode() == "TRUE"; }
class ImportTemplateElement extends HTMLElement {
    constructor() { super(); }
    connectedCallback() {
        if (this.hasAttribute("href")) {
            Include.addImport(this.getAttribute("href"));
        }
    }
}
window.customElements.define("import-template", ImportTemplateElement);
class ImportScriptElement extends HTMLElement {
    constructor() { super(); }
    connectedCallback() {
        if (this.hasAttribute("src")) {
            Include.addScript(this.getAttribute("src"));
        }
    }
}
window.customElements.define("import-script", ImportScriptElement);
var Include;
(function (Include) {
    class ScriptDefinition {
        constructor() {
            this.requested = false;
        }
    }
    class IncludeMgr {
        constructor() {
            this.scriptList = new Array();
            this.resourceLoadedCallbacks = [];
            this.loadScriptAsync = true;
        }
        static AbsolutePath(current, relativePath) {
            let absolutePathSplit = current.split("/");
            let relativePathSplit = relativePath.split("/");
            absolutePathSplit.pop();
            for (var i = 0; i < relativePathSplit.length; i++) {
                if (relativePathSplit[i] === ".") {
                }
                else if (relativePathSplit[i] === "..") {
                    absolutePathSplit.pop();
                }
                else {
                    absolutePathSplit.push(relativePathSplit[i]);
                }
            }
            return absolutePathSplit.join("/");
        }
        processPath(path) {
            if (path[0] !== "/" && path.indexOf("coui://") == -1) {
                path = IncludeMgr.AbsolutePath(window.location.pathname, path);
            }
            else {
                path = path.replace("coui://html_ui", "");
            }
            path = path.toLowerCase().replace(/\/.\//g, '/');
            return path;
        }
        addImport(path, callback = null) {
            path = this.processPath(path);
            var links = window.document.querySelectorAll('link[rel="import"]');
            for (let i = 0; i < links.length; i++) {
                var toTest = links[i].href;
                if (toTest !== "") {
                    toTest = toTest.toLowerCase();
                    toTest = toTest.replace(window.location.origin, "");
                    if (toTest[0] !== "/") {
                        toTest = IncludeMgr.AbsolutePath(window.location.pathname.toLowerCase(), toTest);
                    }
                    if (toTest == path) {
                        if (callback)
                            callback();
                        return;
                    }
                }
            }
            var link = document.createElement("link");
            link.rel = "import";
            link.href = path;
            loader.addResource(path);
            if (callback) {
                this.resourceLoadedCallbacks.push(callback);
            }
            document.head.appendChild(link);
        }
        addImports(path, callback = null) {
            let length = path.length;
            let nbLoaded = 0;
            let cb = () => {
                ++nbLoaded;
                if (nbLoaded >= length) {
                    if (callback)
                        callback();
                }
            };
            for (let toImport of path) {
                if (toImport.indexOf('.html') > -1) {
                    this.addImport(toImport, cb);
                }
                else if (toImport.indexOf('.js') > -1) {
                    this.addScript(toImport, cb);
                }
            }
        }
        addScript(path, callback = null) {
            path = this.processPath(path);
            let isInScripts = false;
            var scripts = document.head.getElementsByTagName("script");
            for (let i = 0; i < scripts.length; i++) {
                var toTest = scripts[i].src;
                if (toTest !== "") {
                    toTest = toTest.toLowerCase();
                    if (toTest.indexOf('/vfs/') == -1) {
                        toTest = toTest.replace("coui://html_ui", "");
                        if (toTest[0] !== "/") {
                            toTest = IncludeMgr.AbsolutePath(window.location.pathname.toLowerCase(), toTest);
                        }
                    }
                    if (toTest === path) {
                        isInScripts = true;
                        break;
                    }
                }
            }
            for (var i = 0; i < this.scriptList.length; i++) {
                if (this.scriptList[i].path == path) {
                    if (callback) {
                        this.scriptList[i].callbacks.push(callback);
                    }
                    return;
                }
            }
            if (isInScripts) {
                if (callback) {
                    callback();
                }
                return;
            }
            var def = new ScriptDefinition();
            def.path = path;
            def.callbacks = [];
            if (callback) {
                def.callbacks.push(callback);
            }
            let request;
            if (this.loadScriptAsync || this.scriptList.length == 0) {
                request = this.requestScript(def);
            }
            this.scriptList.push(def);
            if (request) {
                document.head.appendChild(request);
            }
        }
        requestScript(_def) {
            var scriptRequest = document.createElement("script");
            scriptRequest.type = "text/javascript";
            if (_def.path.indexOf("coui://html_ui") == -1) {
                scriptRequest.src = encodeURI(_def.path);
            }
            else {
                scriptRequest.src = encodeURI(_def.path);
            }
            scriptRequest.onload = this.onScriptLoaded.bind(this, _def);
            _def.requested = true;
            return scriptRequest;
        }
        onScriptLoaded(_def) {
            var found = false;
            for (var i = 0; i < this.scriptList.length; i++) {
                if (this.scriptList[i].path == _def.path) {
                    if (!this.scriptList[i].requested)
                        console.error("Loaded script was not requested : " + _def.path);
                    this.scriptList.splice(i, 1);
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.error("Loaded script was not registered : " + _def.path);
            }
            if (_def.callbacks.length > 0) {
                _def.callbacks.forEach(callback => callback());
            }
            if (!this.loadScriptAsync && this.scriptList.length > 0 && !this.scriptList[0].requested) {
                let request = this.requestScript(this.scriptList[0]);
                if (request)
                    document.head.appendChild(request);
            }
        }
        isLoadingScript(_pattern) {
            var pattern = _pattern.toLowerCase();
            for (var i = 0; i < this.scriptList.length; i++) {
                if (this.scriptList[i].path.indexOf(pattern) >= 0) {
                    return true;
                }
            }
            return false;
        }
    }
    var g_IncludeMgr = new IncludeMgr();
    function addImport(path, callback = null) {
        g_IncludeMgr.addImport(path, callback);
    }
    Include.addImport = addImport;
    function addImports(path, callback = null) {
        g_IncludeMgr.addImports(path, callback);
    }
    Include.addImports = addImports;
    function addScript(path, callback = null) {
        g_IncludeMgr.addScript(path, callback);
    }
    Include.addScript = addScript;
    function isLoadingScript(pattern) {
        return g_IncludeMgr.isLoadingScript(pattern);
    }
    Include.isLoadingScript = isLoadingScript;
    function absolutePath(current, relativePath) {
        return IncludeMgr.AbsolutePath(current, relativePath);
    }
    Include.absolutePath = absolutePath;
    function absoluteURL(current, relativePath) {
        return "coui://html_ui" + IncludeMgr.AbsolutePath(current, relativePath);
    }
    Include.absoluteURL = absoluteURL;
    function setAsyncLoading(_async) {
        g_IncludeMgr.loadScriptAsync = _async;
    }
    Include.setAsyncLoading = setAsyncLoading;
    function onAllResourcesLoaded() {
        let callbacks = [...g_IncludeMgr.resourceLoadedCallbacks];
        for (let callback of callbacks) {
            callback();
            g_IncludeMgr.resourceLoadedCallbacks.splice(g_IncludeMgr.resourceLoadedCallbacks.findIndex(cb => cb === callback), 1);
        }
    }
    Include.onAllResourcesLoaded = onAllResourcesLoaded;
})(Include || (Include = {}));
var LiveReload;
(function (LiveReload) {
    let g_reloadTimeout;
    function reloadCSS() {
        startAutoReload(bAutoReloadCSS);
    }
    LiveReload.reloadCSS = reloadCSS;
    function _reloadCSS(doc) {
        let allCss = doc.head.querySelectorAll("[rel='stylesheet']");
        for (let css of allCss) {
            let url = new URL(css.href);
            let version = url.searchParams.get("version");
            let versionNum = Math.random() * 10000000;
            url.searchParams.set("version", (versionNum).toString());
            css.href = url.href;
        }
    }
    function startAutoReload(autoRefresh = true) {
        _reloadCSS(document);
        var frames = window.frames;
        for (var i = 0; i < frames.length; i++) {
            _reloadCSS(frames[i].document);
        }
        if (autoRefresh)
            g_reloadTimeout = setTimeout(startAutoReload, 2000);
        else
            clearInterval(g_reloadTimeout);
    }
    LiveReload.startAutoReload = startAutoReload;
    if (UI_USE_DATA_FOLDER()) {
        Include.addScript("/JS/config.js", function () {
            function AddLiveReload() {
                var script = document.createElement("script");
                script.src = "http://localhost:35729/livereload.js?snipver=1";
                document.body.appendChild(script);
            }
            if (bLiveReload) {
                if (document.body != null)
                    AddLiveReload();
                else
                    document.addEventListener("DOMContentLoaded", AddLiveReload);
            }
        });
    }
})(LiveReload || (LiveReload = {}));
var Coherent;
var debugDuplicateRegister = false;
var debugLocalization = false;
function cancelAllRequestAnimationFrame() {
    var id = window.requestAnimationFrame(function () { });
    while (id--) {
        window.cancelAnimationFrame(id);
    }
}
var CoherentSetup;
(function (CoherentSetup) {
    function CheckCoherentEngine(windowElem) {
        if (closed) {
            return;
        }
        if (windowElem.frameElement) {
            Coherent = windowElem.top["engine"];
        }
        else {
            Coherent = engine;
        }
        CoherentSetup.updateScreenSize();
        if (window.parent) {
            window.parent.addEventListener('resize', function () {
                CoherentSetup.updateScreenSize();
            });
        }
        window.addEventListener('resize', function () {
            CoherentSetup.updateScreenSize();
        });
    }
    CoherentSetup.CheckCoherentEngine = CheckCoherentEngine;
    function updateScreenSize() {
        var vw = 1;
        var vh = 1;
        if (window.frameElement) {
            vw = window.parent.innerWidth / window.innerWidth;
            vh = window.parent.innerHeight / window.innerHeight;
        }
        let computeVirtualHeight = true;
        if (window["viewportRatioW"]) {
            vw /= window["viewportRatioW"];
            computeVirtualHeight = false;
        }
        if (window["viewportRatioH"]) {
            vh /= window["viewportRatioH"];
            computeVirtualHeight = false;
        }
        if (vw == Infinity || vh == Infinity) {
            requestAnimationFrame(CoherentSetup.updateScreenSize);
            return;
        }
        if (window.document && window.document.documentElement) {
            window.document.documentElement.style.setProperty('--viewportWidth', window.top.innerWidth.toString());
            window.document.documentElement.style.setProperty('--viewportHeight', window.top.innerHeight.toString());
            window.vh = vh;
            window.vw = vw;
            window.document.documentElement.style.setProperty('--viewportHeightRatio', vh.toString());
            window.document.documentElement.style.setProperty('--viewportWidthRatio', vw.toString());
            if (computeVirtualHeight) {
                let r = window.innerWidth / window.innerHeight;
                window.virtualHeight = (r >= 16 / 9 ? window.innerHeight : window.innerWidth * 9 / 16);
                window.document.documentElement.style.setProperty('--currentPageHeight', window.virtualHeight);
            }
            else {
                window.virtualHeight = window.innerHeight;
                window.document.documentElement.style.setProperty('--currentPageHeight', (window.innerHeight).toString());
            }
            if (window["viewportScreenHeight"]) {
                window["unscaledScreenHeight"] = window["viewportScreenHeight"];
            }
            else {
                window["unscaledScreenHeight"] = Math.round(window["vh"] * window["virtualHeight"]);
            }
            window["screenHeight"] = window["unscaledScreenHeight"] * (g_externalVariables.uiScaling ? g_externalVariables.uiScaling / 100 : 1);
            window.document.documentElement.style.setProperty('--uiScale', (g_externalVariables.uiScaling ? g_externalVariables.uiScaling / 100 : 1).toString());
            window.document.documentElement.style.setProperty('--screenHeight', window["screenHeight"].toString());
            window.document.documentElement.style.setProperty('--unscaledScreenHeight', window["unscaledScreenHeight"].toString());
        }
    }
    CoherentSetup.updateScreenSize = updateScreenSize;
    window.document.addEventListener("DOMContentLoaded", function () { CheckCoherentEngine(window); });
    if (window) {
        CheckCoherentEngine(window);
    }
    if (Coherent) {
        Coherent["isViewLoaded"] = false;
        if (debugDuplicateRegister) {
            let baseFunc = Coherent.on;
            Coherent.on = function (name, callback, context) {
                var handlers = engine["events"][name];
                if (handlers) {
                    for (let h of handlers) {
                        if (h.code.toString() === callback.toString() && h.context == (context || Coherent)) {
                            console.warn("Potential Coherent.on duplicate detected for " + name + " :");
                            console.log("Registering ", callback);
                            console.log("With already ", h.code);
                            console.log("Old context", h.context);
                            console.log("New context", context || Coherent);
                            break;
                        }
                    }
                }
                return baseFunc.apply(Coherent, [name, callback, context]);
            };
        }
        ;
        window.document.addEventListener("DOMContentLoaded", function () {
            if (Coherent.isAttached) {
                window.document.body.classList.add("contentLoading");
            }
        });
        Coherent.on("ON_VIEW_RESIZED", function () { window.dispatchEvent(new Event('resize')); });
        Coherent.on("SET_VIEWPORT_RATIO", function (ratioW, ratioH, screenHeight) {
            window["viewportRatioW"] = ratioW;
            window["viewportRatioH"] = ratioH;
            window["viewportScreenHeight"] = screenHeight;
            window.dispatchEvent(new Event('resize'));
        });
        Coherent.on("ON_VIEW_DESTROYED", function () {
            cancelAllRequestAnimationFrame();
            if (window) {
                window["IsDestroying"] = true;
                window.dispatchEvent(new Event('OnDestroy'));
            }
            cancelAllRequestAnimationFrame();
        });
        if (DEBUG()) {
            Coherent.on("DEBUG_TOGGLE_MOUSE", () => {
                let mouse = window.document.getElementById("debugmouse");
                if (!mouse) {
                    mouse = window.document.createElement("span");
                    mouse.id = "debugmouse";
                    mouse.style.position = "absolute";
                    mouse.style.width = "10px";
                    mouse.style.height = "10px";
                    mouse.style.backgroundColor = "magenta";
                    mouse.style.border = "solid 1px red";
                    mouse.style.zIndex = "1000";
                    mouse.style.pointerEvents = "none";
                    window.document.body.appendChild(mouse);
                }
                else
                    mouse.remove();
            });
            window.document.addEventListener("mousemove", (e) => {
                let mouse = window.document.getElementById("debugmouse");
                if (mouse) {
                    mouse.style.left = e.clientX + "px";
                    mouse.style.top = e.clientY + "px";
                }
            });
        }
        if (XBOX()) {
            document.documentElement.classList.add("xbox");
        }
    }
})(CoherentSetup || (CoherentSetup = {}));
var Utils;
(function (Utils) {
    function isRectInRect(inner, outer) {
        return inner.left >= outer.left && inner.right <= outer.right && inner.top >= outer.top && inner.bottom <= outer.bottom;
    }
    Utils.isRectInRect = isRectInRect;
    function dispatchToAllWindows(event) {
        window.top.dispatchEvent(event);
        if (window.top.frames) {
            for (var i = 0; i < window.frames.length; i++) {
                window.frames[i].dispatchEvent(event);
            }
        }
    }
    Utils.dispatchToAllWindows = dispatchToAllWindows;
    function toArray(array) {
        return [...array];
    }
    Utils.toArray = toArray;
    function inIframe() {
        try {
            return window.self !== window.top;
        }
        catch (e) {
            return true;
        }
    }
    Utils.inIframe = inIframe;
    function createDiv(...classList) {
        let div = document.createElement('div');
        classList.forEach(cssClass => {
            div.classList.add(cssClass);
        });
        return div;
    }
    Utils.createDiv = createDiv;
    function getVh(percent) {
        return (percent / 100) * Utils.getVirtualHeight() + "px";
    }
    Utils.getVh = getVh;
    function getSize(px) {
        return (px / 1080) * Utils.getVirtualHeight();
    }
    Utils.getSize = getSize;
    function getVhNumber(percent) {
        return (percent / 100) * Utils.getVirtualHeight();
    }
    Utils.getVhNumber = getVhNumber;
    function getScreenRatio() {
        return (window.innerWidth * window.vw) / Utils.getVirtualHeight();
    }
    Utils.getScreenRatio = getScreenRatio;
    function getVirtualHeight() {
        return window["screenHeight"];
    }
    Utils.getVirtualHeight = getVirtualHeight;
    function scrollbarVisible(element) {
        return element.scrollHeight > element.clientHeight;
    }
    Utils.scrollbarVisible = scrollbarVisible;
    function getExternalImageUrl(url, prefix = "") {
        return "url('" + prefix + url.replace(/\\/g, '/') + "')";
    }
    Utils.getExternalImageUrl = getExternalImageUrl;
    function Modulo(num, mod) {
        return ((num % mod) + mod) % mod;
    }
    Utils.Modulo = Modulo;
    function pad(num, size) {
        var s = num + "";
        while (s.length < size)
            s = "0" + s;
        return s;
    }
    Utils.pad = pad;
    function replace_nth(str, find, replace, index) {
        index += 1;
        if (index == 0) {
            return str.replace(find, replace);
        }
        return str.replace(RegExp("^(?:.*?" + find + "){" + index + "}"), x => x.replace(RegExp(find + "$"), replace));
    }
    Utils.replace_nth = replace_nth;
    function forceParagraphLines(text, n = 2) {
        let formattedText = text.replace('/', '/­');
        let words = formattedText.split(' ');
        if (words.length > 2) {
            let scores = [];
            words.reduce((leftLength, word, index, wordArr) => {
                let currentIndex = leftLength + word.length;
                scores[index] = Math.abs(currentIndex - (formattedText.length - currentIndex - 1));
                if (index < words.length - 1) {
                    currentIndex += 1;
                }
                return currentIndex;
            }, 0);
            var indexOfMinValue = scores.reduce((iMax, x, i, arr) => x < arr[iMax] ? i : iMax, 0);
            let done = 0;
            for (let i = 0; i < words.length; i++) {
                if (i != indexOfMinValue) {
                    formattedText = Utils.replace_nth(formattedText, ' ', '&nbsp;', i - done);
                    done++;
                }
            }
        }
        return formattedText;
    }
    Utils.forceParagraphLines = forceParagraphLines;
    function dashToCamelCase(myStr) {
        return myStr.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
    }
    Utils.dashToCamelCase = dashToCamelCase;
    function timeLine(str) {
        var d = new Date();
        var s = d.getSeconds();
        var m = d.getMilliseconds();
    }
    Utils.timeLine = timeLine;
    function DisplayTimeToSeconds(str) {
        var list = str.split(":");
        var hours = 0;
        var minutes = 0;
        var seconds = 0;
        if (list.length >= 1) {
            hours = parseInt(list[0]);
            if (list.length >= 2) {
                minutes = parseInt(list[1]);
                if (list.length >= 3) {
                    seconds = parseInt(list[2]);
                }
            }
        }
        var val = hours * 3600 + minutes * 60 + seconds;
        return val;
    }
    Utils.DisplayTimeToSeconds = DisplayTimeToSeconds;
    function urlEqual(url1, url2) {
        if (!url1)
            return false;
        url1 = url1.replace("coui://html_ui", "");
        url1 = url1.replace("coui://html_UI", "");
        url2 = url2.replace("coui://html_ui", "");
        url2 = url2.replace("coui://html_UI", "");
        return url1 == url2;
    }
    Utils.urlEqual = urlEqual;
    function RemoveAllChildren(elem) {
        if (elem) {
            while (elem.lastChild)
                elem.removeChild(elem.lastChild);
        }
    }
    Utils.RemoveAllChildren = RemoveAllChildren;
    function formatNumber(x, _bInteger = false) {
        let str = x.toString();
        let g_localization = window.top["g_localization"];
        if (g_localization)
            return g_localization.FormatNumberInString(str, _bInteger);
        return str.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    Utils.formatNumber = formatNumber;
    function formatInteger(x) {
        let str = fastToFixed(x, 0);
        let g_localization = window.top["g_localization"];
        if (g_localization)
            return g_localization.FormatNumberInString(str, true);
        return str.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    Utils.formatInteger = formatInteger;
    function Clamp(n, min, max) {
        if (n < min)
            return min;
        if (n > max)
            return max;
        return n;
    }
    Utils.Clamp = Clamp;
    function Loop(n, min, max) {
        if (n < min)
            return max - Math.abs(n);
        if (n > max)
            return Math.abs(n - max);
        return n;
    }
    Utils.Loop = Loop;
    function isHidden(el, recurs) {
        if (!el)
            return false;
        var style = el.ownerDocument.defaultView.getComputedStyle(el);
        var ishidden = (style.display === 'none');
        if (ishidden) {
            return true;
        }
        else if (recurs) {
            return isHidden(el.parentElement, true);
        }
        return false;
    }
    Utils.isHidden = isHidden;
    function isVisible(elem) {
        if (!(elem instanceof Element))
            throw Error('DomUtil: elem is not an element.');
        const style = getComputedStyle(elem);
        if (style.display === 'none')
            return false;
        if (style.visibility !== 'visible')
            return false;
        if (style.opacity == "0")
            return false;
        let rect = elem.getBoundingClientRect();
        if (elem.offsetWidth + elem.offsetHeight + rect.height +
            rect.width === 0) {
            return false;
        }
        var elementPoints = {
            'center': {
                x: rect.left + elem.offsetWidth / 2,
                y: rect.top + elem.offsetHeight / 2
            },
            'top-left': {
                x: rect.left,
                y: rect.top
            },
            'top-right': {
                x: rect.right,
                y: rect.top
            },
            'bottom-left': {
                x: rect.left,
                y: rect.bottom
            },
            'bottom-right': {
                x: rect.right,
                y: rect.bottom
            }
        };
        let index;
        for (index in elementPoints) {
            var point = elementPoints[index];
            if (point.x < 0)
                return false;
            if (point.x > (document.documentElement.clientWidth || window.innerWidth))
                return false;
            if (point.y < 0)
                return false;
            if (point.y > (document.documentElement.clientHeight || window.innerHeight))
                return false;
            let pointContainer = document.elementFromPoint(point.x, point.y);
            if (pointContainer !== null) {
                do {
                    if (pointContainer === elem)
                        return true;
                } while (pointContainer = pointContainer.parentNode);
            }
        }
        return false;
    }
    Utils.isVisible = isVisible;
    function strToBool(str) {
        if (str.toLowerCase() == "true")
            return true;
        return false;
    }
    Utils.strToBool = strToBool;
    function setInputFilter(textbox, inputFilter) {
        ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function (event) {
            textbox.addEventListener(event, function () {
                if (inputFilter(this.value)) {
                    this.oldValue = this.value;
                    this.oldSelectionStart = this.selectionStart;
                    this.oldSelectionEnd = this.selectionEnd;
                }
                else if (this.hasOwnProperty("oldValue")) {
                    this.value = this.oldValue;
                    this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
                }
            });
        });
    }
    Utils.setInputFilter = setInputFilter;
    function isNumeric(str) {
        let n = parseFloat(str);
        return str.length > 0 && !isNaN(n) && isFinite(n);
    }
    Utils.isNumeric = isNumeric;
    function isInteger(str) {
        let n = parseInt(str);
        return str.length > 0 && !isNaN(n) && isFinite(n);
    }
    Utils.isInteger = isInteger;
    function SmoothPow(origin, destination, smoothFactor, dTime) {
        if (origin == undefined)
            return destination;
        if (dTime <= 0 || smoothFactor <= 1.0)
            return destination;
        var smooth = 1.0 - (1.0 / Math.pow(smoothFactor, dTime * (1.0 / 0.033)));
        var delta = destination - origin;
        var result = (delta * smooth) + origin;
        return result;
    }
    Utils.SmoothPow = SmoothPow;
    function SmoothLinear(origin, destination, smoothFactor, dTime) {
        if (origin == undefined)
            return destination;
        if (smoothFactor <= 0)
            return destination;
        if (Math.abs(destination - origin) < Number.EPSILON)
            return destination;
        let result = destination;
        if (origin > destination) {
            result = origin - smoothFactor * dTime;
            if (result < destination)
                result = destination;
        }
        else {
            result = origin + smoothFactor * dTime;
            if (result > destination)
                result = destination;
        }
        return result;
    }
    Utils.SmoothLinear = SmoothLinear;
    function SmoothSin(origin, destination, smoothFactor, dTime) {
        if (origin == undefined)
            return destination;
        if (Math.abs(destination - origin) < Number.EPSILON)
            return destination;
        let delta = destination - origin;
        let result = origin + delta * Math.sin(Math.min(smoothFactor * dTime, 1.0) * Math.PI / 2.0);
        if ((origin < destination && result > destination) || (origin > destination && result < destination))
            result = destination;
        return result;
    }
    Utils.SmoothSin = SmoothSin;
    function ClearIframe(elem) {
        function clearInner(node) {
            while (node.hasChildNodes()) {
                clear(node.firstChild);
            }
        }
        function clear(node) {
            while (node.hasChildNodes()) {
                clear(node.firstChild);
            }
            node.parentNode.removeChild(node);
        }
        clearInner(elem);
    }
    Utils.ClearIframe = ClearIframe;
    function generateGUID() {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return "GUID_" + (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }
    Utils.generateGUID = generateGUID;
    function containStr(str, title) {
        str = str.trim().toLowerCase();
        title = title.trim().toLowerCase();
        if (str == "" || title == "") {
            return true;
        }
        if (title.indexOf(str) !== -1) {
            return true;
        }
        return false;
    }
    Utils.containStr = containStr;
    function getCaretPosition(ctrl) {
        var caretPos = 0;
        if (document.selection) {
            ctrl.focus();
            var sel = document.selection.createRange();
            sel.moveStart('character', -ctrl.value.length);
            caretPos = sel.text.length;
        }
        else if (ctrl.selectionStart || ctrl.selectionStart == '0') {
            caretPos = ctrl.selectionStart;
        }
        return caretPos;
    }
    Utils.getCaretPosition = getCaretPosition;
    function setCaretPosition(ctrl, pos) {
        if (ctrl.setSelectionRange) {
            ctrl.focus();
            ctrl.setSelectionRange(pos, pos);
        }
        else if (ctrl.createTextRange) {
            var range = ctrl.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    }
    Utils.setCaretPosition = setCaretPosition;
    function generateRandomName() {
        let alphabet = "aaaaaaaaaabcdeeeeeeeefghiiiiiijklmnooooooopqrstuvwxyz";
        let ret = "";
        let nbChars = Math.random() * 15 + 4;
        for (let i = 0; i < nbChars; i++) {
            let index = Math.floor(Math.random() * alphabet.length);
            ret += alphabet.charAt(index);
        }
        return ret;
    }
    Utils.generateRandomName = generateRandomName;
    function generateLorem(length) {
        let base = "Lateri et dives Tauri attolluntur late Tauri omnibus bonis interscindit qui dextro attolluntur qui Cilicia viget bonis frugibus interscindit flumen viget adnexa porrigitur late eiusque palmite flumen dextro pari ortum lateri palmite omnibus palmite adnexa mediam eiusque solis solis quam frugibus palmite eiusque Calycadnus navigabile pari Calycadnus porrigitur flumen lateri attolluntur attolluntur frugibus ad adnexa solis ortum Tauri Tauri qui Isauria qui Tauri quam mediam Tauri solis ad dives viget montis terra Isauria solis Cilicia bonis adnexa uberi pari Tauri pari adnexa et sublimius Calycadnus distentis navigabile palmite solis solis eiusque et viget uberi porrigitur minutis distentis mediam Cilicia Cilicia.Lateri et dives Tauri attolluntur late Tauri omnibus bonis interscindit qui dextro attolluntur qui Cilicia viget bonis frugibus interscindit flumen viget adnexa porrigitur late eiusque palmite flumen dextro pari ortum lateri palmite omnibus palmite adnexa mediam eiusque solis solis quam frugibus palmite eiusque Calycadnus navigabile pari Calycadnus porrigitur flumen lateri attolluntur attolluntur frugibus ad adnexa solis ortum Tauri Tauri qui Isauria qui Tauri quam mediam Tauri solis ad dives viget montis terra Isauria solis Cilicia bonis adnexa uberi pari Tauri pari adnexa et sublimius Calycadnus distentis navigabile palmite solis solis eiusque et viget uberi porrigitur minutis distentis mediam Cilicia Cilicia.Lateri et dives Tauri attolluntur late Tauri omnibus bonis interscindit qui dextro attolluntur qui Cilicia viget bonis frugibus interscindit flumen viget adnexa porrigitur late eiusque palmite flumen dextro pari ortum lateri palmite omnibus palmite adnexa mediam eiusque solis solis quam frugibus palmite eiusque Calycadnus navigabile pari Calycadnus porrigitur flumen lateri attolluntur attolluntur frugibus ad adnexa solis ortum Tauri Tauri qui Isauria qui Tauri quam mediam Tauri solis ad dives viget montis terra Isauria solis Cilicia bonis adnexa uberi pari Tauri pari adnexa et sublimius Calycadnus distentis navigabile palmite solis solis eiusque et viget uberi porrigitur minutis distentis mediam Cilicia Cilicia.Lateri et dives Tauri attolluntur late Tauri omnibus bonis interscindit qui dextro attolluntur qui Cilicia viget bonis frugibus interscindit flumen viget adnexa porrigitur late eiusque palmite flumen dextro pari ortum lateri palmite omnibus palmite adnexa mediam eiusque solis solis quam frugibus palmite eiusque Calycadnus navigabile pari Calycadnus porrigitur flumen lateri attolluntur attolluntur frugibus ad adnexa solis ortum Tauri Tauri qui Isauria qui Tauri quam mediam Tauri solis ad dives viget montis terra Isauria solis Cilicia bonis adnexa uberi pari Tauri pari adnexa et sublimius Calycadnus distentis navigabile palmite solis solis eiusque et viget uberi porrigitur minutis distentis mediam Cilicia Cilicia.Lateri et dives Tauri attolluntur late Tauri omnibus bonis interscindit qui dextro attolluntur qui Cilicia viget bonis frugibus interscindit flumen viget adnexa porrigitur late eiusque palmite flumen dextro pari ortum lateri palmite omnibus palmite adnexa mediam eiusque solis solis quam frugibus palmite eiusque Calycadnus navigabile pari Calycadnus porrigitur flumen lateri attolluntur attolluntur frugibus ad adnexa solis ortum Tauri Tauri qui Isauria qui Tauri quam mediam Tauri solis ad dives viget montis terra Isauria solis Cilicia bonis adnexa uberi pari Tauri pari adnexa et sublimius Calycadnus distentis navigabile palmite solis solis eiusque et viget uberi porrigitur minutis distentis mediam Cilicia Cilicia.";
        let start = Math.round((Math.random() * base.length - length));
        return base.substring(start, start + length);
    }
    Utils.generateLorem = generateLorem;
    let m_ProfanityListener;
    function filterProfanity(str) {
        if (!m_ProfanityListener) {
            m_ProfanityListener = RegisterViewListener("JS_LISTENER_PROFANITY_FILTER");
        }
        return new Promise((resolve) => {
            m_ProfanityListener.trigger("REQUEST_PROFANITY_CHECK", str);
            let cb = (strToCheck, strFiltered) => {
                if (strToCheck == str) {
                    resolve(strFiltered);
                    m_ProfanityListener.off("PROFANITY_FILTER_RESULT", cb);
                }
            };
            m_ProfanityListener.on("PROFANITY_FILTER_RESULT", cb);
        });
    }
    Utils.filterProfanity = filterProfanity;
    function Translate(key) {
        if (!isNaN(parseFloat(key)))
            return key;
        if (debugLocalization != null && debugLocalization === true)
            return "";
        if (key == null || key === "")
            return "";
        let g_localization = window.top["g_localization"];
        if (g_localization)
            return g_localization.Translate(key);
        return null;
    }
    Utils.Translate = Translate;
    function SetTextVariable(varName, value) {
        let g_localization = window.top["g_localization"];
        if (g_localization)
            g_localization.AddTextVariable(varName, value);
    }
    Utils.SetTextVariable = SetTextVariable;
    function RemoveTextVariable(varName) {
        let g_localization = window.top["g_localization"];
        if (g_localization)
            g_localization.RemoveTextVariable(varName);
    }
    Utils.RemoveTextVariable = RemoveTextVariable;
    function SecondsToDisplayDuration(totalSeconds, withMinutes, withSeconds, doLocalize = true) {
        if (doLocalize) {
            let g_localization = window.top["g_localization"];
            if (g_localization)
                return g_localization.SecondsToDisplayDuration(totalSeconds, withMinutes, withSeconds);
        }
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = (withMinutes) ? Math.floor((totalSeconds - (hours * 3600)) / 60) : -1;
        var seconds = (withSeconds) ? Math.floor(totalSeconds - (minutes * 60) - (hours * 3600)) : -1;
        return timeToString(hours, minutes, seconds);
    }
    Utils.SecondsToDisplayDuration = SecondsToDisplayDuration;
    function SecondsToDisplayTime(totalSeconds, withMinutes, withSeconds, doLocalize = true) {
        if (doLocalize) {
            let g_localization = window.top["g_localization"];
            if (g_localization)
                return g_localization.SecondsToDisplayTime(totalSeconds, withMinutes, withSeconds);
        }
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = (withMinutes) ? Math.floor((totalSeconds - (hours * 3600)) / 60) : -1;
        var seconds = (withSeconds) ? Math.floor(totalSeconds - (minutes * 60) - (hours * 3600)) : -1;
        return timeToString(hours, minutes, seconds);
    }
    Utils.SecondsToDisplayTime = SecondsToDisplayTime;
    function timeToString(hours, minutes, seconds) {
        let val = "";
        if (hours >= 0) {
            if (hours < 10)
                val += "0";
            val += hours;
        }
        if (minutes >= 0) {
            if (hours >= 0) {
                val += ":";
            }
            if (minutes < 10)
                val += "0";
            val += minutes;
        }
        if (seconds >= 0) {
            if (hours >= 0 || minutes >= 0) {
                val += ":";
            }
            if (seconds < 10)
                val += "0";
            val += seconds;
        }
        return val;
    }
    Utils.timeToString = timeToString;
    let g_fileExistCache;
    function doesFileExist(file) {
        if (!g_fileExistCache)
            g_fileExistCache = {};
        if (g_fileExistCache[file] != null) {
            return g_fileExistCache[file];
        }
        let fileMgr = window.top["g_fileMgr"];
        if (file.startsWith("/"))
            file = "coui://html_UI/" + file;
        if (fileMgr) {
            let ret = fileMgr.DoesFileExist(file);
            g_fileExistCache[file] = ret;
            return ret;
        }
        else
            return false;
    }
    Utils.doesFileExist = doesFileExist;
    function loadFile(file, callbackSuccess) {
        return new Promise((resolve, reject) => {
            let httpRequest = new XMLHttpRequest();
            httpRequest.onreadystatechange = function (data) {
                if (this.readyState === XMLHttpRequest.DONE) {
                    let loaded = this.status === 200 || this.status === 0;
                    if (loaded) {
                        resolve(this.responseText);
                        if (callbackSuccess instanceof Function)
                            callbackSuccess(this.responseText);
                    }
                    else {
                        reject(new Error("Unable to load file, got HTTP " + this.status));
                    }
                }
            };
            httpRequest.open("GET", file);
            httpRequest.send();
        });
    }
    Utils.loadFile = loadFile;
    function slowDeepClone(object) {
        return JSON.parse(JSON.stringify(object));
    }
    Utils.slowDeepClone = slowDeepClone;
    function showTooltip(id, tooltip, posXRel, posYRel, maxWidth = -1) {
        if (g_externalVariables.showTooltips) {
            Coherent.trigger("SHOW_TOOLTIP", id, tooltip, posXRel, posYRel, maxWidth);
        }
    }
    Utils.showTooltip = showTooltip;
    function hideTooltip(id) {
        if (g_externalVariables.showTooltips) {
            Coherent.trigger("HIDE_TOOLTIP", id);
        }
    }
    Utils.hideTooltip = hideTooltip;
    function leadingZeros(_value, _nbDigits, _pointFixed = -1) {
        if (_pointFixed >= 0)
            _value = Number(_value.toFixed(_pointFixed));
        let i = 1;
        while (i <= _nbDigits) {
            let sign = Math.sign(_value);
            let absValue = Math.abs(_value);
            let max = Math.pow(10, i);
            if (absValue < max) {
                let result = "";
                if (sign < 0) {
                    result += "-";
                }
                while (i < _nbDigits) {
                    result += "0";
                    i++;
                }
                if (_pointFixed >= 0)
                    result += absValue.toFixed(_pointFixed);
                else
                    result += absValue;
                return result;
            }
            i++;
        }
        if (_pointFixed >= 0)
            return _value.toFixed(_pointFixed);
        return _value.toString();
    }
    Utils.leadingZeros = leadingZeros;
    function decimalDegreesToDMS(decimalDegrees, leadingZeros = 0, maxDigits = 0, signed = false) {
        let dd = Math.abs(decimalDegrees);
        let degrees = Math.trunc(dd);
        let minutes = Math.floor((dd - degrees) * 60);
        let seconds = (dd - degrees - minutes / 60) * 3600;
        return ((signed && decimalDegrees < 0) ? "-" : "") + Utils.leadingZeros(degrees, leadingZeros) + "°" + Utils.leadingZeros(minutes, leadingZeros) + "'" + Utils.leadingZeros(seconds, leadingZeros, maxDigits) + "\"";
    }
    Utils.decimalDegreesToDMS = decimalDegreesToDMS;
    function countDecimals(_step) {
        var text = _step.toString();
        var index = text.indexOf(".");
        return index == -1 ? 0 : (text.length - index - 1);
    }
    Utils.countDecimals = countDecimals;
    function preLoadDeviceIcons(subPath, imgNameList) {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            loadIcon(subPath, imgNameList);
        }
        else
            document.addEventListener('DOMContentLoaded', loadIcon.bind(null, subPath, imgNameList), { once: true });
    }
    Utils.preLoadDeviceIcons = preLoadDeviceIcons;
    function loadIcon(subPath, imgNameList) {
        const iconList = document.createElement('div');
        document.body.appendChild(iconList);
        const promises = [];
        for (let i = 0; i < imgNameList.length; i++) {
            promises.push(new Promise(resolve => {
                let preloadIcon = document.createElement('device-button');
                preloadIcon.addEventListener('iconElementLoaded', () => {
                    resolve();
                });
                preloadIcon.setData(subPath, imgNameList[i], '');
                iconList.appendChild(preloadIcon);
            }));
        }
        Promise.all(promises).then(() => {
            document.body.removeChild(iconList);
        });
    }
})(Utils || (Utils = {}));
function SetBackgroundImage(img) {
    Coherent.trigger("SET_BACKGROUND_IMAGE", img);
}
function SetBlurredBackgroundRatio(val) {
    Coherent.trigger("SET_BLURRED_BACKGROUND_RATIO", val);
}
function SetBlurredBackground(bVal) {
    Coherent.trigger("SET_BLURRED_BACKGROUND", bVal);
}
SetBlurredBackground(true);
class SoundManager {
    RegisterSoundButton(elem, type = "") {
        if (!this.m_registered)
            this.m_registered = new Array();
        function findElement(element) {
            return element === elem;
        }
        var index = this.m_registered.findIndex(findElement);
        if (index <= 0) {
            this.m_registered.push(elem);
            let mouseEnter = this.OnMouseOverOnElement.bind(this, elem, type);
            let mouseLeave = this.OnMouseLeaveElement.bind(this, elem, type);
            let mouseDown = this.OnMouseDownOnElement.bind(this, elem, type);
            let mouseUp = this.OnClickOnElement.bind(this, elem, type);
            elem.addEventListener("mouseenter", mouseEnter);
            elem.addEventListener("mouseleave", mouseLeave);
            elem.addEventListener("mousedown", mouseDown);
            elem.addEventListener("mouseup", mouseUp);
            return () => {
                function findElement(element) {
                    return element === elem;
                }
                var index = this.m_registered.findIndex(findElement);
                if (index > 0) {
                    this.m_registered.splice(index, 1);
                    elem.removeEventListener("mouseenter", mouseEnter);
                    elem.removeEventListener("mouseleave", mouseLeave);
                    elem.removeEventListener("mousedown", mouseDown);
                    elem.removeEventListener("mouseup", mouseUp);
                }
            };
        }
        else {
            return null;
        }
    }
    canPlaySound(elem) {
        return !elem.hasAttribute("locked") && !elem.classList.contains("locked") && !elem.classList.contains("disabled") && !elem.classList.contains("disappear");
    }
    OnMouseOverOnElement(elem, type, ev) {
        if (ev.target === ev.currentTarget && this.canPlaySound(elem)) {
            this.PlaySound(SoundManager.SND_OVER, type);
        }
    }
    OnMouseLeaveElement(elem, type, ev) {
        elem.removeAttribute("mouse-down");
    }
    OnMouseDownOnElement(elem, type, ev) {
        if (this.canPlaySound(elem)) {
            elem.setAttribute("mouse-down", "");
        }
        else {
            this.PlaySound(SoundManager.SND_INVALID, type);
        }
    }
    OnClickOnElement(elem, type, ev) {
        if (this.canPlaySound(elem)) {
            if (elem.hasAttribute("mouse-down")) {
                elem.removeAttribute("mouse-down");
                this.PlaySound(SoundManager.SND_VALID, type);
            }
        }
        else {
            this.PlaySound(SoundManager.SND_INVALID, type);
        }
    }
    PlaySound(sndNType, buttonType) {
        var eventName = "UI_";
        if (buttonType != null) {
            if (buttonType.length > 0)
                eventName += buttonType + "_";
        }
        eventName += sndNType;
        Coherent.trigger("PLAY_SOUND_FROM_VIEW", eventName);
    }
}
SoundManager.SND_VALID = "VALID";
SoundManager.SND_OVER = "SELECT";
SoundManager.SND_INVALID = "INVALID";
var g_SoundMgr = new SoundManager();
function LaunchFlowEvent(eventName, ...args) {
    if (bDebugListeners) {
        console.warn("LaunchFlowEvent " + eventName, args);
    }
    Coherent.trigger("LAUNCH_FLOW_EVENT_FROM_VIEW", eventName, ...args);
}
function LaunchFlowEventToGlobalFlow(eventName, ...args) {
    if (bDebugListeners) {
        console.warn("LaunchFlowEventToGlobalFlow " + eventName, args);
    }
    Coherent.trigger("LAUNCH_FLOW_EVENT_TO_GLOBAL_FLOW_FROM_VIEW", eventName, ...args);
}
function OpenBrowser(url) {
    Coherent.trigger("OPEN_WEB_BROWSER", url);
}
function InstanciateTemplate2(selector, templatedElement) {
    let templateTextContent = document.getElementById(selector);
    if (templateTextContent == null) {
        var links = window.document.querySelectorAll('link[rel="import"]');
        for (var index = 0; index < links.length; index++) {
            let link = links[index];
            if (link["import"] != null) {
                templateTextContent = link["import"].getElementById(selector);
            }
            if (templateTextContent != null)
                break;
        }
        if (templateTextContent == null) {
            console.error("Template " + selector + " not found :'( ");
            return null;
        }
    }
    let templateElement = document.createElement("div");
    templateElement.innerHTML = templateTextContent.textContent;
    let fragment = document.createDocumentFragment();
    for (let i = 0; i < templateElement.childElementCount; i++) {
        let element = templateElement.children[i].cloneNode(true);
        fragment.appendChild(element);
    }
    let slots = fragment.querySelectorAll('template-slot');
    if (templatedElement) {
        Array.from(slots).forEach(slot => {
            if (slot.hasAttribute('name')) {
                let slottables = templatedElement.querySelectorAll(`[target-template-slot="${slot.getAttribute("name")}"]`);
                if (slottables.length > 0) {
                    slottables.forEach(slottable => {
                        if (slot.parentElement) {
                            slot.parentElement.insertBefore(slottable, slot);
                        }
                        else {
                            fragment.insertBefore(slottable, slot);
                        }
                    });
                }
            }
            else {
                Array.from(templatedElement.children).forEach(templateChild => {
                    if (!templateChild.hasAttribute("target-template-slot")) {
                        if (slot.parentElement) {
                            slot.parentElement.insertBefore(templateChild, slot);
                        }
                        else {
                            fragment.insertBefore(templateChild, slot);
                        }
                    }
                });
            }
        });
        Array.from(slots).forEach(slot => slot.remove());
    }
    return fragment;
}
function InstanciateTemplate(parent, selector) {
    var helperID = selector + "_INSTANCE";
    var helper = null;
    if (helper == null) {
        var template = window.document.getElementById(selector);
        if (template == null) {
            var links = window.document.querySelectorAll('link[rel="import"]');
            for (var index = 0; index < links.length; index++) {
                let link = links[index];
                if (link["import"] != null) {
                    template = link["import"].getElementById(selector);
                }
                if (template != null)
                    break;
            }
            if (template == null) {
                console.error("Template " + selector + " not found :'( ");
                return null;
            }
        }
        helper = window.document.createElement('div');
        helper.id = helperID;
        TemplateElement.copyAttributes(template, helper);
        helper.innerHTML = template.textContent;
    }
    return helper;
}
var UINavigationMode;
(function (UINavigationMode) {
    UINavigationMode[UINavigationMode["None"] = -1] = "None";
    UINavigationMode[UINavigationMode["Mouse"] = 0] = "Mouse";
    UINavigationMode[UINavigationMode["Keys"] = 1] = "Keys";
    UINavigationMode[UINavigationMode["CursorPad"] = 2] = "CursorPad";
    UINavigationMode[UINavigationMode["PadSnap"] = 3] = "PadSnap";
})(UINavigationMode || (UINavigationMode = {}));
class UINavigation {
    static get lockFocus() { return window.top["LockFocus"] === true; }
    static set lockFocus(val) { window.top["LockFocus"] = val; }
    static get previous() {
        let previous = window.top["previousUIElement"];
        if (previous && previous.canBeSelectedWithKeys() && previous.isChildOf(document.body))
            return previous;
        return null;
    }
    static get previousRaw() {
        return window.top["previousUIElement"];
    }
    static set previous(elem) {
        window.top["previousUIElement"] = elem;
    }
    static get current() {
        let elem = window.top["activeUIElement"];
        if (elem && elem.canBeSelectedWithKeys())
            return elem;
        return null;
    }
    static get currentRaw() {
        let elem = window.top["activeUIElement"];
        if (elem)
            return elem;
        return null;
    }
    static get myExclusiveFocusGuid() {
        if (!UINavigation.m_myExclusiveFocusGuid) {
            UINavigation.m_myExclusiveFocusGuid = Utils.generateGUID() + ':' + document.title;
        }
        return UINavigation.m_myExclusiveFocusGuid;
    }
    static set currentExclusiveFocusGuid(guid) {
        UINavigation.m_currentExclusiveFocusGuid = guid;
        if (!UINavigation.canFocusProximity) {
            UINavigation.clearCurrentClosest();
        }
    }
    static get currentExclusiveFocusGuid() {
        return UINavigation.m_currentExclusiveFocusGuid;
    }
    static get canFocusProximity() {
        return UINavigation.currentExclusiveFocusGuid == "" || UINavigation.currentExclusiveFocusGuid == UINavigation.myExclusiveFocusGuid;
    }
    static get hasFocus() {
        return UINavigation.currentExclusiveFocusGuid == UINavigation.myExclusiveFocusGuid;
    }
    static askGrabKeys() {
        Coherent.trigger("ASK_GRAB_KEYS");
    }
    static releaseKeys() {
        Coherent.trigger("ASK_RELEASE_KEYS");
    }
    static addPadSelectable(elt) {
        UINavigation.m_padSelectables.push(elt);
    }
    static removePadSelectable(elt) {
        let eltIndex = UINavigation.m_padSelectables.indexOf(elt);
        if (eltIndex >= 0) {
            UINavigation.m_padSelectables.splice(eltIndex, 1);
        }
    }
    static OnButtonFocus(target) {
        if (target) {
            let clientRect = target.getBoundingClientRect();
            Coherent.trigger("BUTTON_FOCUS", clientRect.left + clientRect.width * 0.5, clientRect.top + clientRect.height * 0.5);
        }
    }
    static OnButtonBlur() {
        Coherent.trigger("BUTTON_BLUR");
    }
    static forcePadCursorPositionOnDefaultButton() {
        let target = UINavigation.getDefaultButton(document.body);
        if (target)
            UINavigation.forcePadCursorPosition(target);
    }
    static forcePadCursorPosition(target) {
        if (target) {
            let pos = Vec2.FromRect(target.getBoundingClientRect());
            Coherent.trigger('FORCE_PAD_CURSOR_POSITION', pos.x, pos.y);
        }
        else {
            console.error("forcePadCursorPosition target is null");
        }
    }
    static set current(elem) {
        if (elem === UINavigation.current)
            return;
        if (elem && !elem.canBeSelectedWithKeys())
            return;
        if (UINavigation.currentRaw == elem)
            return;
        let previous = UINavigation.currentRaw;
        if (UINavigation.currentRaw) {
            UINavigation.previous = UINavigation.currentRaw;
        }
        if (!isWindowEnabled()) {
            window.top["activeUIElement"] = null;
        }
        else {
            window.top["activeUIElement"] = elem;
        }
        if (previous && previous != elem) {
            UINavigation.OnButtonBlur();
            previous.blur();
        }
        let previousElem = UINavigation.previous;
        let currentElem = UINavigation.current;
        UINavigation.OnButtonFocus(elem);
        if (currentElem) {
            if (currentElem.shouldDispatchChildActive()) {
                let parent = currentElem.parentElement;
                while (parent) {
                    let parentUI = UIElement.getUIElement(parent);
                    if (parentUI) {
                        parentUI.onActiveChildFocused(currentElem);
                    }
                    parent = parent.parentElement;
                }
            }
        }
        if (previousElem) {
            if (previousElem.shouldDispatchChildActive()) {
                let parent = previousElem.parentElement;
                while (parent) {
                    let parentUI = UIElement.getUIElement(parent);
                    if (parentUI) {
                        parentUI.onActiveChildBlurred(UINavigation.currentRaw);
                    }
                    parent = parent.parentElement;
                }
            }
        }
        window.dispatchEvent(new Event("currentActiveElementChanged"));
        if (bDebugKeyNavigation) {
            let cons = document.querySelector("#DebugKeyNavigation");
            if (!cons) {
                cons = document.createElement("div");
                document.body.appendChild(cons);
                cons.id = "DebugKeyNavigation";
                cons.style.display = "block";
                cons.style.width = "200px";
                if (UINavigation.canNavigate())
                    cons.style.backgroundColor = "grey";
                else {
                    cons.style.backgroundColor = "red";
                }
                cons.style.color = "white";
                cons.style.position = "absolute";
                cons.style.left = "100px";
                cons.style.top = "500px";
                cons.style.zIndex = "10000";
                cons.style.maxHeight = "400px";
                cons.style.overflow = "hidden";
            }
            if (UINavigation.current)
                cons.innerText = UINavigation.current.globalGridColumn + "-" + UINavigation.current.globalGridColumnEnd + "/" + UINavigation.current.globalGridRow + "-" + UINavigation.current.globalGridRowEnd + "----> " + UINavigation.current.outerHTML;
            else
                cons.innerText = "";
        }
    }
    static get MouseMode() {
        return UINavigation.m_navigationMode == UINavigationMode.Mouse;
    }
    static get PadCursorMode() {
        return UINavigation.m_navigationMode == UINavigationMode.CursorPad;
    }
    static set NavigationMode(mode) {
        UINavigation.m_navigationMode = mode;
    }
    static get NavigationMode() {
        return UINavigation.m_navigationMode;
    }
    static switchNativigationMode(mode) {
        if (mode == UINavigation.NavigationMode) {
            return;
        }
        UINavigation.leaveCurrentNavigationMode();
        switch (mode) {
            case UINavigationMode.Mouse:
                UINavigation.enterMouseMode();
                break;
            case UINavigationMode.Keys:
                UINavigation.enterKeysMode();
                break;
            case UINavigationMode.CursorPad:
            case UINavigationMode.PadSnap:
                UINavigation.enterCursorMode(mode);
                break;
        }
    }
    static leaveCurrentNavigationMode() {
        switch (UINavigation.NavigationMode) {
            case UINavigationMode.Mouse:
                break;
            case UINavigationMode.Keys:
                UINavigation.disableKeyNavigation();
                break;
            case UINavigationMode.CursorPad:
            case UINavigationMode.PadSnap:
                UINavigation.exitCursorMode();
                break;
        }
    }
    static addMouseModeEventListener(callback) {
        window.addEventListener("onmousemode", callback);
    }
    static removeMouseModeEventListener(callback) {
        window.removeEventListener("onmousemode", callback);
    }
    static addKeysModeEventListener(callback) {
        window.addEventListener("onkeysmode", callback);
    }
    static removeKeysModeEventListener(callback) {
        window.removeEventListener("onkeysmode", callback);
    }
    static enterCursorMode(mode) {
        if (UINavigation.PadCursorMode)
            return;
        UINavigation.NavigationMode = UINavigationMode.CursorPad;
        UINavigation.m_cursorMode = mode;
        window.dispatchEvent(new Event("updateExternal:cursorModeOn"));
        if (mode == 2) {
            window.addEventListener("mousemove", UINavigation.checkButtonsProximity);
        }
        else {
            Coherent.on("RequestClosestRect", UINavigation.requestClosest);
            window.addEventListener("mousemove", UINavigation.focusUnderMouse);
        }
        let body = document.querySelector('body');
        if (body)
            body.addEventListener('mouseleave', UINavigation.clearOnMouseLeaveView);
        Coherent.on("cursorClick", UINavigation.validateProximity);
    }
    static exitCursorMode() {
        window.dispatchEvent(new Event("updateExternal:cursorModeOff"));
        UINavigation.clearCurrentClosest();
        if (UINavigation.m_cursorMode == 2) {
            window.removeEventListener("mousemove", UINavigation.checkButtonsProximity);
        }
        else {
            Coherent.off("RequestClosestRect", UINavigation.requestClosest);
            window.removeEventListener("mousemove", UINavigation.focusUnderMouse);
        }
        let body = document.querySelector('body');
        if (body)
            body.removeEventListener('mouseleave', UINavigation.clearOnMouseLeaveView);
        Coherent.off("cursorClick", UINavigation.validateProximity);
        Coherent.off("RequestClosestRect", UINavigation.requestClosest);
        window.dispatchEvent(new Event("resetPadScroll"));
        if (UINavigation.PadCursorMode)
            UINavigation.NavigationMode = UINavigationMode.None;
        UINavigation.m_cursorMode = 0;
    }
    static isSelectableElement(elt) {
        if (!elt)
            return false;
        let buttonElement = elt;
        if (!buttonElement)
            return false;
        if (!buttonElement.padInteractive)
            return false;
        if (!buttonElement.interactive)
            return false;
        if (buttonElement.locked)
            return false;
        if (buttonElement instanceof UINavigationBlocElement) {
            return elt.padInteractive;
        }
        return buttonElement.hasMouseOver || (UINavigation.PadCursorMode && buttonElement.padInteractive);
    }
    static findSelectableElement(elt) {
        let cur = elt;
        while (cur) {
            if (UINavigation.isSelectableElement(cur)) {
                return cur;
            }
            cur = cur.parentElement;
        }
        return null;
    }
    static set currentPadCursorHoverElement(elt) {
        if (UINavigation.m_currentPadCursorHoverElement == elt) {
            return;
        }
        UINavigation.m_currentPadCursorHoverElement = elt;
        window.dispatchEvent(new Event("currentPadCursorHoverElementChanged"));
    }
    static get currentPadCursorHoverElement() {
        return UINavigation.m_currentPadCursorHoverElement;
    }
    static updateCurrentPadCursorHoverElement(e) {
        let elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
        if (elementUnderMouse) {
            let cur = elementUnderMouse;
            while (cur) {
                if (cur instanceof UIElement) {
                    UINavigation.currentPadCursorHoverElement = cur;
                    break;
                }
                cur = cur.parentElement;
            }
        }
        else {
            UINavigation.currentPadCursorHoverElement = null;
        }
    }
    static focusUnderMouse(e) {
        let mx = e.clientX;
        let my = e.clientY;
        let elementUnderMouse = document.elementFromPoint(mx, my);
        let selectableUnderMouse = UINavigation.findSelectableElement(elementUnderMouse);
        if (!UINavigation.hasFocus && elementUnderMouse && elementUnderMouse.closest('ingame-ui')) {
            UINavigation.currentExclusiveFocusGuid = UINavigation.myExclusiveFocusGuid;
            Coherent.trigger('TAKE_EXCLUSIVE_FOCUS', UINavigation.myExclusiveFocusGuid);
        }
        if (elementUnderMouse && elementUnderMouse.closest("virtual-scroll")) {
            UINavigation.currentPadCursorHoverElement = elementUnderMouse;
        }
        else {
            if (selectableUnderMouse) {
                UINavigation.currentPadCursorHoverElement = selectableUnderMouse;
            }
            else {
                UINavigation.updateCurrentPadCursorHoverElement(e);
            }
        }
    }
    static checkButtonsProximity(e) {
        if (!UINavigation.m_TestPoints) {
            let nbPoints = 16;
            let angleSection = Math.PI * 2 / nbPoints;
            UINavigation.m_TestPoints = [];
            for (let i = 0; i < nbPoints; i++) {
                let angle = i * angleSection;
                UINavigation.m_TestPoints.push(new Vec2(Math.cos(angle), Math.sin(angle)));
            }
        }
        let radius = g_externalVariables.cursorSize * window.innerHeight || 10;
        let mx = e.clientX;
        let my = e.clientY;
        let ctx = null;
        bDebugCursor = false;
        if (bDebugCursor) {
            if (!this.m_mouseDebug) {
                this.m_mouseDebug = document.createElement("canvas");
                this.m_mouseDebug.setAttribute("style", "position: absolute; left: 0px; top: 0px; bottom: 0px; right: 0px; display: block; width:100%; height:100%; pointer-events:none;");
                this.m_mouseDebug.setAttribute("width", window.innerWidth + "px");
                this.m_mouseDebug.setAttribute("height", window.innerHeight + "px");
                document.body.appendChild(this.m_mouseDebug);
            }
            ctx = this.m_mouseDebug.getContext('2d');
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            ctx.beginPath();
            ctx.strokeStyle = "blue";
            ctx.arc(mx, my, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = "blue";
        }
        let elementUnderMouse = document.elementFromPoint(mx, my);
        let selectableUnderMouse = UINavigation.findSelectableElement(elementUnderMouse);
        let lookAround = !UINavigation.isSelectableElement(selectableUnderMouse);
        if (lookAround && UINavigation.hasFocus) {
            Coherent.trigger('RESET_EXCLUSIVE_FOCUS', UINavigation.myExclusiveFocusGuid);
        }
        else if (!lookAround && !UINavigation.hasFocus) {
            UINavigation.currentExclusiveFocusGuid = UINavigation.myExclusiveFocusGuid;
            Coherent.trigger('TAKE_EXCLUSIVE_FOCUS', UINavigation.myExclusiveFocusGuid);
        }
        let drad = 8;
        let closestAround;
        let bDebugStr = false;
        let debugStr;
        if (bDebugStr)
            debugStr = "*** checkButtonsProximity summary ***\nlookAround:" + lookAround;
        if (lookAround) {
            selectableUnderMouse = null;
            let foundElements = [];
            for (let ptRef of UINavigation.m_TestPoints) {
                let ptX = mx + ptRef.x * radius;
                let ptY = my + ptRef.y * radius;
                let elementUnder = document.elementFromPoint(ptX, ptY);
                let isUnderPoint = false;
                if (elementUnder) {
                    let possibleClosestAround = UINavigation.findSelectableElement(elementUnder);
                    if (!possibleClosestAround) {
                        if (debugStr)
                            debugStr += "\n(" + ptRef.x + "," + ptRef.y + ") no closest found -> ";
                        continue;
                    }
                    if (!UINavigation.isSelectableElement(possibleClosestAround)) {
                        if (bDebugStr)
                            debugStr += "\n" + possibleClosestAround.tagName + "(" + ptRef.x + "," + ptRef.y + ") is not a real button -> ";
                        continue;
                    }
                    closestAround = possibleClosestAround;
                    isUnderPoint = true;
                    if (bDebugStr)
                        debugStr += "\n" + closestAround.tagName + "(" + ptRef.x + "," + ptRef.y + ") found -> ";
                    if (ctx) {
                        ctx.strokeStyle = "green";
                        let rect = closestAround.getBoundingClientRect();
                        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                    }
                }
                else {
                    if (bDebugStr)
                        debugStr += "\n(" + ptRef.x + "," + ptRef.y + ") nothing found -> ";
                }
                if (ctx) {
                    if (isUnderPoint) {
                        ctx.strokeStyle = "green";
                        ctx.strokeRect(ptX - drad * 0.5, ptY - drad * 0.5, drad, drad);
                    }
                    else {
                        ctx.strokeStyle = "red";
                        ctx.strokeRect(ptX - drad * 0.5, ptY - drad * 0.5, drad, drad);
                    }
                }
                if (isUnderPoint) {
                    foundElements.push(closestAround);
                }
            }
            let center = new Vec2(mx, my);
            let closestIndex = 0;
            let maxDistance = Number.MAX_VALUE;
            let curIndex = 0;
            for (let elt of foundElements) {
                let pointPos = Vec2.FromRect(elt.getBoundingClientRect());
                let distance = pointPos.SqrDistance(center);
                if (distance < maxDistance) {
                    maxDistance = distance;
                    closestIndex = curIndex;
                }
                curIndex++;
            }
            closestAround = foundElements[closestIndex];
        }
        if (bDebugStr)
            debugStr += "\nselection result selectableUnderMouse:" + (selectableUnderMouse ? selectableUnderMouse.tagName : "none") + " closestAround: " + (closestAround ? closestAround.tagName : "none");
        if (!selectableUnderMouse && !closestAround) {
            UINavigation.clearCurrentClosest();
            UINavigation.updateCurrentPadCursorHoverElement(e);
            return;
        }
        else {
            let closestTarget;
            if (closestAround && !selectableUnderMouse && UINavigation.canFocusProximity) {
                closestTarget = closestAround;
            }
            else {
                closestTarget = selectableUnderMouse;
            }
            if (closestTarget == UINavigation.m_currentClosest) {
                UINavigation.updateCurrentPadCursorHoverElement(e);
                return;
            }
            if (closestTarget) {
                closestTarget.classList.add("CloseToMouse");
                if (bDebugStr)
                    debugStr += "\nfocus on " + closestTarget.tagName;
                closestTarget.focus();
                UINavigation.m_currentClosest = closestTarget;
                UINavigation.currentPadCursorHoverElement = closestTarget;
            }
            else {
                UINavigation.updateCurrentPadCursorHoverElement(e);
            }
        }
        if (bDebugStr) {
            console.log(debugStr);
        }
    }
    static isSelectionableInHtmlTree(elt) {
        let cur = elt;
        while (cur) {
            if (cur.classList.contains('disabled')
                || cur.classList.contains('greyed-notif')
                || cur.classList.contains('greyed-popup')
                || cur.classList.contains('flowbar-obstruct')) {
                return false;
            }
            if (cur instanceof UIElement) {
                let curUIElement = cur;
                if (!curUIElement.isVisible) {
                    return false;
                }
            }
            if (cur.tagName == 'VIRTUAL-SCROLL') {
                if (!Utils.isRectInRect(elt.getBoundingClientRect(), cur.getBoundingClientRect())) {
                    return false;
                }
            }
            cur = cur.parentElement;
        }
        return true;
    }
    static isSelectionableInHtmlTreeDebug(elt) {
        let cur = elt;
        while (cur) {
            if (cur.classList.contains('disabled')
                || cur.classList.contains('greyed-notif')
                || cur.classList.contains('greyed-popup')
                || cur.classList.contains('flowbar-obstruct')) {
                return [false, 'parent has disabled or greyed or obstruct'];
            }
            if (cur instanceof UIElement) {
                let curUIElement = cur;
                if (!curUIElement.isVisible) {
                    return [false, 'parent is not visible'];
                }
            }
            if (cur.tagName == 'VIRTUAL-SCROLL') {
                if (!Utils.isRectInRect(elt.getBoundingClientRect(), cur.getBoundingClientRect())) {
                    let reason = 'scroll ' + UINavigation.TagPath(cur);
                    return [false, reason];
                }
            }
            cur = cur.parentElement;
        }
        return [true, 'ok'];
    }
    static findClosestButtonElement(mx, my) {
        let radius = g_externalVariables.cursorSize * window.innerHeight || 10;
        let closestArray = [];
        let center = new Vec2(mx, my);
        let maxDistance = radius * radius;
        let ctx = null;
        let bEnableDebug = false;
        let bEnableDebugDisplayAllRect = false;
        let bEnableDebugFindSelectable = false;
        if (bEnableDebug) {
            if (!this.m_mouseDebug) {
                this.m_mouseDebug = document.createElement("canvas");
                this.m_mouseDebug.setAttribute("style", "position: absolute; left: 0px; top: 0px; bottom: 0px; right: 0px; display: block; width:100%; height:100%; pointer-events:none;");
                this.m_mouseDebug.setAttribute("width", window.innerWidth + "px");
                this.m_mouseDebug.setAttribute("height", window.innerHeight + "px");
                document.body.appendChild(this.m_mouseDebug);
            }
            ctx = this.m_mouseDebug.getContext('2d');
        }
        if (ctx) {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
        let filteredArray = UINavigation.FilterRectsInsideRadius(UINavigation.m_padSelectables, center, maxDistance);
        filteredArray.forEach((cur) => {
            if (cur.tabIndex < 0)
                return;
            if (!UINavigation.isSelectableElement(cur))
                return;
            let rect = cur.getBoundingClientRect();
            let pos = Vec2.FromRect(rect);
            if (ctx && bEnableDebugDisplayAllRect) {
                ctx.strokeStyle = "cyan";
                ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                ctx.font = "20px Arial";
                ctx.fillStyle = "cyan";
                ctx.fillText("mouse:" + center.x + "," + center.y + " rc:" + pos.x + "," + pos.y + " rect:" + rect.left + "," + rect.top + "," + rect.width + "," + rect.height, rect.left + 10, pos.y);
            }
            let selectionable = false;
            if (ctx && bEnableDebugFindSelectable) {
                let isSelectionableResult = UINavigation.isSelectionableInHtmlTreeDebug(cur);
                selectionable = isSelectionableResult[0];
                let reason = isSelectionableResult[1];
                ctx.strokeStyle = "red";
                ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                ctx.font = "20px Arial";
                ctx.fillStyle = "cyan";
                ctx.fillText("not visible: " + reason, rect.left + 10, pos.y);
            }
            else {
                selectionable = UINavigation.isSelectionableInHtmlTree(cur);
            }
            if (!selectionable) {
                return;
            }
            if (pos.x <= 0 && pos.y <= 0)
                return;
            closestArray.push(cur);
            if (ctx) {
                UINavigation.DrawDebugLine(ctx, center, pos, "green");
            }
        });
        if (closestArray.length > 0) {
            closestArray.forEach((closest) => {
                let rect = closest.getBoundingClientRect();
                Coherent.trigger('CLOSEST_BUTTON', document.URL, UINavigation.TagPath(closest), rect.left, rect.top, rect.right, rect.bottom, !closest.classList.contains(closest.notHighlightableClassName));
            });
        }
        else {
            Coherent.trigger('NO_CLOSEST_BUTTON');
        }
    }
    static FilterRectsInsideRadius(array, center, sqrRadius) {
        let filteredArray = new Array();
        for (var i = 0; i < array.length; i++) {
            if (center.RectSqrDistance(array[i].getBoundingClientRect()) < sqrRadius) {
                filteredArray.push(array[i]);
            }
        }
        return filteredArray;
    }
    static TagPath(elt) {
        let result = elt.tagName;
        let parent = elt.parentElement;
        while (parent) {
            result = result + ':' + parent.tagName;
            parent = parent.parentElement;
        }
        return result;
    }
    static DrawDebugLine(ctx, from, to, color) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    static DrawDebugCircle(ctx, center, radius, color, isFilled) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.closePath();
        if (isFilled) {
            ctx.fill();
        }
        ctx.stroke();
    }
    static clearCurrentClosest() {
        if (!UINavigation.m_currentClosest)
            return;
        UINavigation.m_currentClosest.classList.remove("CloseToMouse");
        if (UINavigation.m_currentClosest.focused) {
            UINavigation.m_currentClosest.blur();
        }
        UINavigation.m_currentClosest = null;
    }
    static validateProximity(e) {
        if (!UINavigation.PadCursorMode) {
            console.error('validateProximity should not be called when m_navigationMode is ' + UINavigation.m_navigationMode);
            return;
        }
        if (UINavigation.m_currentClosest && UINavigation.m_currentClosest instanceof ButtonElement) {
            UINavigation.m_currentClosest.padValidate();
        }
    }
    static clearOnMouseLeaveView(e) {
        UINavigation.clearCurrentClosest();
        UINavigation.current = null;
        UINavigation.currentPadCursorHoverElement = null;
        window.dispatchEvent(new Event("resetPadScroll"));
    }
    static clearNonFocusedPanel() {
        UINavigation.clearCurrentClosest();
        UINavigation.current = null;
        if (UINavigation.currentPadCursorHoverElement) {
            UINavigation.currentPadCursorHoverElement.blur();
        }
        UINavigation.currentPadCursorHoverElement = null;
        window.dispatchEvent(new Event("resetPadScroll"));
    }
    static enterMouseMode() {
        if (UINavigation.MouseMode)
            return;
        UINavigation.NavigationMode = UINavigationMode.Mouse;
        UINavigation.current = null;
        Utils.dispatchToAllWindows(new Event("onmousemode"));
    }
    static onKeyDown(e) {
        if (!UINavigation.KeysMode)
            return;
        if (!UINavigation.current) {
            if ([KeyCode.KEY_LEFT, KeyCode.KEY_RIGHT, KeyCode.KEY_UP, KeyCode.KEY_DOWN].includes(e.keyCode)) {
                UINavigation.enterKeysMode();
            }
        }
    }
    static onEnableChange() {
        if (isWindowEnabled()) {
        }
        else {
            if (UINavigation.current)
                UINavigation.current.blur();
            UINavigation.current = null;
            if (document.activeElement)
                document.activeElement.blur();
        }
    }
    static setPageVisible(val) {
        UINavigation.m_pageVisible = val;
    }
    static isPageVisible() {
        return UINavigation.m_pageVisible;
    }
    static get KeysMode() {
        return UINavigation.m_navigationMode == UINavigationMode.Keys;
    }
    static get CursorMode() {
        return UINavigation.m_navigationMode == UINavigationMode.CursorPad;
    }
    static findFocusedUIElement(root) {
        let focused = root.querySelector(".Focused");
        if (focused) {
            let uiElem = UIElement.getUIElement(focused);
            if (uiElem && uiElem.canBeSelectedWithKeys()) {
                return uiElem;
            }
        }
    }
    static findDefaultUIElement(root, startFromLast = false) {
        let allDefaultButtons = root.querySelectorAll("[default-button]");
        if (bDebugKeyNavigation) {
            console.warn("allDefaultButtons for ", root, allDefaultButtons);
        }
        let elementCount = allDefaultButtons.length;
        for (let i = startFromLast ? elementCount - 1 : 0; startFromLast ? i >= 0 : i < elementCount; startFromLast ? i-- : i++) {
            let button = allDefaultButtons[i];
            let uiElem = UIElement.getUIElement(button);
            if (uiElem) {
                if (uiElem.canBeSelectedWithKeys()) {
                    return uiElem;
                }
                else if (uiElem.getDefaultChildButton()) {
                    let childUiElem = uiElem.getDefaultChildButton();
                    if (childUiElem && childUiElem.canBeSelectedWithKeys()) {
                        return childUiElem;
                    }
                }
            }
        }
    }
    static findSelectedUIElement(root) {
        let selected = root.querySelector(".selected:not(.disabled), .Selected:not(.disabled)");
        if (selected) {
            let uiElem = UIElement.getUIElement(selected);
            if (uiElem && uiElem.canBeSelectedWithKeys()) {
                return uiElem;
            }
        }
    }
    static findDefaultChildUIElement(root, startFromLast = false) {
        let allDefaultButtons = [...(root.hasAttribute("default-child-button") ? [root] : []), ...root.querySelectorAll("[default-child-button]")];
        let elementCount = allDefaultButtons.length;
        for (let i = startFromLast ? elementCount - 1 : 0; startFromLast ? i >= 0 : i < elementCount; startFromLast ? i-- : i++) {
            let parentButton = allDefaultButtons[i];
            let defChild = parentButton.querySelector(parentButton.getAttribute("default-child-button"));
            if (defChild) {
                let uiElem = UIElement.getUIElement(defChild);
                if (uiElem && uiElem.canBeSelectedWithKeys()) {
                    return uiElem;
                }
            }
        }
    }
    static findSelectedParentUIElement(root) {
        let selectedButton = root.querySelector(".selected");
        if (selectedButton && UIElement.getUIElement(selectedButton)) {
            let uiElem = selectedButton;
            if (uiElem && uiElem.canBeSelectedWithKeys())
                return uiElem;
        }
    }
    static findTabIndexUIElement(root) {
        let allSelectable = Array.from(root.querySelectorAll('[tabindex]'));
        for (let testButton of allSelectable) {
            if (testButton.tabIndex >= 0) {
                if (testButton["canBeSelectedWithKeys"] == undefined) {
                    console.error("testButton.canBeSelectedWithKeys not defined for ", testButton);
                    continue;
                }
            }
            if (testButton.tabIndex <= 0 || !testButton.canBeSelectedWithKeys())
                continue;
            let uiElem = UIElement.getUIElement(testButton);
            if (uiElem && !uiElem.disabled) {
                return uiElem;
            }
        }
    }
    static findFocusableUIElement(uiElem, startFromLast = false) {
        let allFocusable = uiElem.getAllFocusableChildren();
        let elementCount = allFocusable.length;
        for (let i = startFromLast ? elementCount - 1 : 0; startFromLast ? i >= 0 : i < elementCount; startFromLast ? i-- : i++) {
            let child = allFocusable[i];
            let uiChild = UIElement.getUIElement(child);
            if (uiChild && uiChild.canBeSelectedWithKeys()) {
                let defaultButton = uiChild.getDefaultButton();
                if (defaultButton && defaultButton.canBeSelectedWithKeys()) {
                    if (bDebugKeyNavigation)
                        console.warn("default button", uiElem, defaultButton);
                    return defaultButton;
                }
            }
        }
    }
    static getDefaultButton(root = null) {
        if (!root)
            root = document.body;
        let defaultButton = this.findFocusedUIElement(root) ||
            this.findDefaultUIElement(root) ||
            this.findSelectedUIElement(root) ||
            this.findDefaultChildUIElement(root) ||
            this.findSelectedParentUIElement(root) ||
            this.findTabIndexUIElement(root);
        if (defaultButton) {
            if (bDebugKeyNavigation)
                console.warn("Found default button", defaultButton);
            return defaultButton;
        }
    }
    static canNavigate() {
        if (!UINavigation.KeysMode)
            return false;
        if (!isWindowEnabled())
            return false;
        if (PopUp.isBlockedByPopUp())
            return false;
        return true;
    }
    static onShow() {
        document.body.classList.remove("disappear");
        UINavigation.setPageVisible(true);
        if (UINavigation.KeysMode) {
            let defButton = UINavigation.getDefaultButton();
            if (defButton) {
                defButton.focusByKeys(0);
            }
        }
    }
    static onHide() {
        document.body.classList.add("disappear");
        UINavigation.setPageVisible(false);
        UINavigation.previous = null;
        UINavigation.current = null;
    }
    static disableKeyNavigation() {
        if (!window.top)
            return;
        if (!document)
            return;
        if (UINavigation.current) {
            UINavigation.previous = UINavigation.current;
            UINavigation.current.blur();
        }
        if (document.activeElement)
            document.activeElement.blur();
        UINavigation.current = null;
        UINavigation.enterMouseMode();
        if (bDebugKeyNavigation)
            console.warn("disableKeyNavigation");
    }
    static onKeyDownOnRoot(keycode) {
        if ([KeyCode.KEY_LEFT, KeyCode.KEY_RIGHT, KeyCode.KEY_UP, KeyCode.KEY_DOWN].includes(keycode)) {
            Coherent.trigger("ON_KEY_DOWN_ON_ROOT", keycode);
        }
    }
    static enterKeysMode() {
        if (document.activeElement && document.activeElement.nodeName == "INPUT")
            return;
        if (!document)
            return;
        let sendEvent = !UINavigation.KeysMode;
        UINavigation.NavigationMode = UINavigationMode.Keys;
        if (!UINavigation.isPageVisible()) {
            return;
        }
        let defaultKeyReciever = document.querySelector("[default-key-reciever]");
        if (defaultKeyReciever) {
            if (!defaultKeyReciever.canEnterKeysMode)
                return false;
        }
        if (!UINavigation.canNavigate()) {
            if (bDebugKeyNavigation)
                console.warn("CANNOT NAVIGATE");
            return;
        }
        if (!isWindowEnabled()) {
            if (bDebugKeyNavigation)
                console.warn("WINDOW IS NOT ENABLED");
            return;
        }
        if (UINavigation.current) {
            if (bDebugKeyNavigation)
                console.warn("current ", UINavigation.current);
            UINavigation.current.focus();
        }
        else {
            if (UINavigation.previous && !window.document.body.hasAttribute("no-previous-button")) {
                UINavigation.previous.focus();
            }
            else {
                let defaultButton = UINavigation.getDefaultButton(window.top.document.body);
                if (!defaultButton) {
                    for (let i = 0; i < window.top.frames.length; i++) {
                        defaultButton = UINavigation.getDefaultButton(window.top.frames[i].document.body);
                        if (defaultButton) {
                            break;
                        }
                    }
                }
                if (defaultButton) {
                    defaultButton.focusByKeys();
                }
                else {
                    if (bDebugKeyNavigation)
                        console.warn("NO DEFAULT BUTTON");
                    if (defaultKeyReciever) {
                        defaultKeyReciever.registerDefaultKeyEvents();
                        defaultKeyReciever.focus();
                    }
                }
            }
        }
        if (sendEvent) {
            Utils.dispatchToAllWindows(new Event("onkeysmode"));
        }
    }
}
UINavigation.m_cursorMode = 0;
UINavigation.m_myExclusiveFocusGuid = null;
UINavigation.m_currentExclusiveFocusGuid = null;
UINavigation.m_padSelectables = new Array();
UINavigation.m_navigationMode = UINavigationMode.None;
UINavigation.requestClosest = (x, y) => {
    UINavigation.findClosestButtonElement(x, y);
};
UINavigation.m_currentPadCursorHoverElement = null;
UINavigation.m_prevX = 0;
UINavigation.m_prevY = 0;
UINavigation.m_pageVisible = false;
window.addEventListener("windowEnabledChange", UINavigation.onEnableChange);
document.addEventListener("keydown", UINavigation.onKeyDown);
Coherent.on("DisableKeysSelectionMode", UINavigation.disableKeyNavigation);
Coherent.on("OnShow", UINavigation.onShow);
Coherent.on("StartHideView", UINavigation.onHide);
var KeyNavigationDirection;
(function (KeyNavigationDirection) {
    KeyNavigationDirection[KeyNavigationDirection["KeyNavigation_None"] = 0] = "KeyNavigation_None";
    KeyNavigationDirection[KeyNavigationDirection["KeyNavigation_Horizontal"] = 1] = "KeyNavigation_Horizontal";
    KeyNavigationDirection[KeyNavigationDirection["KeyNavigation_Vertical"] = 2] = "KeyNavigation_Vertical";
    KeyNavigationDirection[KeyNavigationDirection["KeyNavigation_Grid"] = 3] = "KeyNavigation_Grid";
})(KeyNavigationDirection || (KeyNavigationDirection = {}));
class UIElement extends HTMLElement {
    constructor() {
        super();
        this.m_DummyUIElement = true;
        this.m_canEnterKeysMode = true;
        this.onDefaultKeyDown = (e) => {
            this.onKeyDown(e.keyCode);
        };
        this.onDefaultKeyUp = (e) => {
            this.onKeyUp(e.keyCode);
        };
        this.m_localGrid = null;
        this.requestPadFilterRectInfo = () => {
            let filterType = this.getAttribute('pad-filter-type');
            let filterTarget = this.getAttribute('pad-filter-target');
            let rect = this.getBoundingClientRect();
            Coherent.trigger('PAD_FILTER_RECT_INFO', filterType, filterTarget, rect.left, rect.top, rect.right, rect.bottom);
        };
        this.sendSizeUpdate = () => {
            this.dispatchEvent(new CustomEvent("virtualScrollSizeUpdate", { bubbles: true }));
        };
        this.previousButton = null;
        if (bDebugElementsCreation) {
            console.trace("creating ", this);
        }
    }
    static getUIElement(elem) {
        if (elem) {
            if (elem.m_DummyUIElement === true)
                return elem;
        }
        return null;
    }
    disconnectedCallback() {
        if (this.hasAttribute('pad-filter-type')) {
            Coherent.off('RequestFilterRectInfo', this.requestPadFilterRectInfo);
        }
        this.blur();
    }
    canUseScreenReader() {
        return true;
    }
    get childActiveClass() { return ""; }
    shouldDispatchChildActive() { return !this.hasAttribute("stop-child-active"); }
    get canEnterKeysMode() { return this.m_canEnterKeysMode; }
    set canEnterKeysMode(val) {
        this.m_canEnterKeysMode = val;
        if (val) {
            if (UINavigation.KeysMode)
                UINavigation.enterKeysMode();
        }
    }
    onActiveChildBlurred(child) {
    }
    onActiveChildFocused(child) {
    }
    registerDefaultKeyEvents() {
        this.tabIndex = 1;
        this.addEventListener("keydown", this.onDefaultKeyDown);
        this.addEventListener("keyup", this.onDefaultKeyUp);
    }
    get _localgridColumn() {
        if (this.hasAttribute("local-grid-column"))
            return this.getAttribute("local-grid-column").padStart(2, "0");
        else
            return "";
    }
    get _localgridColumnEnd() {
        if (this.hasAttribute("local-grid-column-end"))
            return this.getAttribute("local-grid-column-end").padStart(2, "0");
        else
            return this._localgridColumn;
    }
    get _localgridRow() {
        if (this.hasAttribute("local-grid-row"))
            return this.getAttribute("local-grid-row").padStart(2, "0");
        else
            return "";
    }
    get _localgridRowEnd() {
        if (this.hasAttribute("local-grid-row-end"))
            return this.getAttribute("local-grid-row-end").padStart(2, "0");
        else
            return this._localgridRow;
    }
    get localGrid() {
        if (this.m_localGrid)
            return this.m_localGrid;
        let ret = null;
        if (this.hasAttribute("local-grid")) {
            let attr = this.getAttribute("local-grid").split("/");
            let colStartEnd = attr[0].split("-");
            let rowStartEnd = attr[1].split("-");
            ret = {
                col: colStartEnd[0],
                colEnd: colStartEnd[1] || colStartEnd[0],
                row: rowStartEnd[0],
                rowEnd: rowStartEnd[1] || rowStartEnd[0]
            };
        }
        else {
            if (this.hasAttribute("local-grid-column") || this.hasAttribute("local-grid-row")) {
                ret = {
                    col: this._localgridColumn,
                    row: this._localgridRow,
                    rowEnd: this._localgridRowEnd,
                    colEnd: this._localgridColumnEnd
                };
            }
        }
        if (ret) {
            if (ret.col != "")
                ret.col = ret.col.padStart(2, "0");
            if (ret.colEnd != "")
                ret.colEnd = ret.colEnd.padStart(2, "0");
            if (ret.row != "")
                ret.row = ret.row.padStart(2, "0");
            if (ret.rowEnd != "")
                ret.rowEnd = ret.rowEnd.padStart(2, "0");
        }
        this.m_localGrid = ret;
        return ret;
    }
    get localgridColumn() { return this.localGrid ? this.localGrid.col : ""; }
    get localgridColumnEnd() { return this.localGrid ? this.localGrid.colEnd : ""; }
    get localgridRow() { return this.localGrid ? this.localGrid.row : ""; }
    get localgridRowEnd() { return this.localGrid ? this.localGrid.rowEnd : ""; }
    set localgridColumn(value) { this.setAttribute("local-grid-column", value); }
    get globalGridColumn() {
        if (this.m_globalGridColumn)
            return this.m_globalGridColumn;
        let ret = [this.localgridColumn];
        let parent = this.parentElement;
        while (parent) {
            let parentUI = UIElement.getUIElement(parent);
            if (parentUI) {
                if (parentUI.localgridColumn != "")
                    ret.push(parentUI.localgridColumn);
            }
            parent = parent.parentElement;
        }
        ret = ret.reverse();
        this.m_globalGridColumn = ret;
        return ret;
    }
    get globalGridColumnEnd() {
        if (this.m_globalGridColumnEnd)
            return this.m_globalGridColumnEnd;
        let ret = [this.localgridColumnEnd];
        let parent = this.parentElement;
        while (parent) {
            let parentUI = UIElement.getUIElement(parent);
            if (parentUI) {
                if (parentUI.localgridColumnEnd != "")
                    ret.push(parentUI.localgridColumn);
            }
            parent = parent.parentElement;
        }
        ret = ret.reverse();
        this.m_globalGridColumnEnd = ret;
        return ret;
    }
    get globalGridRow() {
        if (this.m_globalGridRow)
            return this.m_globalGridRow;
        let ret = [this.localgridRow];
        let parent = this.parentElement;
        while (parent) {
            let parentUI = UIElement.getUIElement(parent);
            if (parentUI && parentUI.localgridRow != "") {
                ret.push(parentUI.localgridRow);
            }
            parent = parent.parentElement;
        }
        ret = ret.reverse();
        this.m_globalGridRow = ret;
        return ret;
    }
    get globalGridRowEnd() {
        if (this.m_globalGridRowEnd)
            return this.m_globalGridRowEnd;
        let ret = [this.localgridRowEnd];
        let parent = this.parentElement;
        while (parent) {
            let parentUI = UIElement.getUIElement(parent);
            if (parentUI && parentUI.localgridRowEnd != "") {
                ret.push(parentUI.localgridRowEnd);
            }
            parent = parent.parentElement;
        }
        ret = ret.reverse();
        this.m_globalGridRowEnd = ret;
        return ret;
    }
    unregisterDefaultKeyEvents() {
        this.tabIndex = -1;
        this.removeEventListener("keydown", this.onDefaultKeyDown);
        this.removeEventListener("keyup", this.onDefaultKeyUp);
    }
    spreadToChildren(parent, parentClass, childClass) {
        for (var ch of parent.children) {
            ch.classList.add(childClass);
            if (!ch.classList.contains(parentClass))
                this.spreadToChildren(ch, parentClass, childClass);
        }
    }
    unspreadToChildren(parent, parentClass, childClass) {
        for (let ch of parent.children) {
            if (!ch.classList.contains(parentClass)) {
                ch.classList.remove(childClass);
                this.unspreadToChildren(ch, parentClass, childClass);
            }
        }
    }
    setVisible(val) {
        this.classList.toggle("hide", !val);
        if (!val) {
            if (UINavigation.current) {
                if (UINavigation.current == this || UINavigation.current.isChildOf(this)) {
                    UINavigation.current.blur();
                }
            }
        }
        this.onVisibilityChange(val);
    }
    isVisible() {
        return !this.classList.contains("hide") && !this.classList.contains("panelInvisible") && !this.classList.contains("invisible") &&
            !(XBOX() && this.classList.contains("noXbox"));
    }
    onVisibilityChange(visible) {
    }
    get enabled() {
        return !this.classList.contains("disabled");
    }
    enable(bool) {
        this.classList.toggle("disabled", !bool);
        if (UINavigation.currentRaw && !bool) {
            if (UINavigation.currentRaw == this || UINavigation.currentRaw.isChildOf(this)) {
                UINavigation.currentRaw.blur();
            }
        }
        else if (UINavigation.currentRaw == this && bool && UINavigation.KeysMode) {
            this.focusByKeys(-1);
        }
    }
    disable(bool) {
        this.enable(!bool);
    }
    set disabled(bool) {
        if (this.disabled != bool)
            this.disable(bool);
    }
    isOneParentHidden() {
        if (!this.isVisible())
            return false;
        let parent = this.parentElement;
        while (parent) {
            if (parent.classList.contains("hide") || parent.classList.contains("panelInvisible"))
                return true;
            parent = parent.parentElement;
        }
        return false;
    }
    isOneParentDisabled() {
        if (!this.isVisible())
            return false;
        if (!this.isVisible())
            return false;
        let parent = this.parentElement;
        while (parent) {
            if (parent.classList.contains("disabled"))
                return true;
            parent = parent.parentElement;
        }
        return false;
        return (this.closest("disabled") !== null);
    }
    get disabled() {
        return this.classList.contains("disabled");
    }
    canBeSelectedDisabled() { return false; }
    canBeSelectedLocked() { return !this.hasAttribute('no-locked-navigation'); }
    canBeSelectedWithKeys() {
        if (this.getRootNode() != document)
            return false;
        return !this.forceNoKeyNavigation && this.canBeSelected && this.isVisible() && !this.isOneParentDisabled() && !this.isOneParentHidden() && (this.enabled || this.canBeSelectedDisabled()) && (!this.locked || this.canBeSelectedLocked());
    }
    get forceNoKeyNavigation() {
        return UINavigation.KeysMode && (this.hasAttribute("no-key-navigation") && this.getAttribute("no-key-navigation") != "false");
    }
    get canBeSelected() {
        if (this.hasAttribute("can-be-selected"))
            return true;
        if (this.hasAttribute("auto-inside"))
            return true;
        return false;
    }
    get locked() { return this.hasAttribute("locked") || this.classList.contains('parentLocked'); }
    set locked(val) {
        if (val)
            this.setAttribute("locked", "");
        else
            this.removeAttribute("locked");
        this.classList.toggle("locked", this.hasAttribute("locked"));
        if (val)
            this.spreadToChildren(this, "locked", "parentLocked");
        else
            this.unspreadToChildren(this, "locked", "parentLocked");
        if (UINavigation.currentRaw && !UINavigation.currentRaw.canBeSelectedLocked()) {
            if (UINavigation.currentRaw == this || UINavigation.currentRaw.isChildOf(this)) {
                UINavigation.currentRaw.blur();
            }
        }
    }
    get loading() {
        return this.classList.contains("activeLoading");
    }
    set loading(val) {
        let previousState = this.classList.contains("activeLoading");
        if (previousState != val) {
            if (val) {
                let overlay = document.createElement("div");
                overlay.classList.add("loading-overlay");
                let overlayContent = document.createElement("div");
                overlayContent.classList.add("loading-overlay__content");
                overlay.appendChild(overlayContent);
                Include.addImport("/templates/IconStack/IconStack.html");
                let stack = document.createElement("icon-stack");
                let loaderIcon = new IconElement();
                loaderIcon.setAttribute("data-url", "/icons/ICON_LOADING.svg");
                stack.appendChild(loaderIcon);
                overlayContent.appendChild(stack);
                let title = new LabelizeElement();
                title.setAttribute('key', this.loadingText ? this.loadingText : "TT:MENU.LOADING");
                overlayContent.appendChild(title);
                this.appendChild(overlay);
            }
            else {
                let loadingOverlay = this.querySelector(":scope > .loading-overlay");
                if (loadingOverlay)
                    this.removeChild(loadingOverlay);
            }
            this.classList.toggle("activeLoading", val);
        }
    }
    get loadingText() {
        return this.getAttribute('active-loading-text');
    }
    set loadingText(val) {
        this.setAttribute('active-loading-text', val);
    }
    connectedCallback() {
        this.m_globalGridColumn = null;
        this.m_globalGridColumnEnd = null;
        this.m_globalGridRow = null;
        this.m_globalGridRowEnd = null;
        if (this.hasAttribute('pad-filter-type')) {
            Coherent.on('RequestFilterRectInfo', this.requestPadFilterRectInfo);
        }
    }
    isTransparent() {
        return true;
    }
    static get observedAttributes() { return ["local-grid", "local-grid-column", "local-grid-column-end", "local-grid-row", "local-grid-row-end"]; }
    attributeChangedCallback(name, oldValue, newValue) {
        if (["local-grid", "local-grid-column", "local-grid-column-end", "local-grid-row", "local-grid-row-end"].includes(name)) {
            this.m_localGrid = null;
            this.localGrid;
        }
    }
    static getRenderSize(data, direction) {
        console.warn('unimplemented getRenderSize method for ' + this.constructor.name);
        return 0;
    }
    isParentOf(child) {
        if (child == this)
            return true;
        if (!child)
            return false;
        let parent = child.parentElement;
        while (parent) {
            if (parent == this)
                return true;
            parent = parent.parentElement;
        }
        return false;
    }
    isChildOf(parentToTest) {
        if (!parentToTest)
            return false;
        let parent = this.parentElement;
        while (parent) {
            if (parent == parentToTest)
                return true;
            parent = parent.parentElement;
        }
        let thisWindow = this.ownerDocument.defaultView;
        if (thisWindow.frameElement) {
            let allFrames = parentToTest.querySelectorAll("iframe");
            for (let iframe of allFrames) {
                if (iframe == thisWindow.frameElement) {
                    return true;
                }
            }
        }
        return false;
    }
    hasParentHidden() {
        if (this.classList.contains("hide") || this.classList.contains("invisible") || this.classList.contains("panelInvisible"))
            return true;
        let parent = this.parentElement;
        while (parent) {
            if (parent.classList.contains("hide") || parent.classList.contains("invisible") || parent.classList.contains("panelInvisible"))
                return true;
            parent = parent.parentElement;
        }
        return false;
    }
    focus() {
        super.focus();
    }
    get focused() {
        return this.classList.contains("Focused") || this.classList.contains("focused");
    }
    queryElement(selector) {
        return this.querySelector(selector);
    }
    setJSONData(data) { }
    setAnyData(data) { }
    getKeyNavigationDirection() {
        if (this.hasAttribute("grid-navigation"))
            return KeyNavigationDirection.KeyNavigation_Grid;
        else if (this.hasAttribute("vertical-navigation"))
            return KeyNavigationDirection.KeyNavigation_Vertical;
        else if (this.hasAttribute("horizontal-navigation"))
            return KeyNavigationDirection.KeyNavigation_Horizontal;
        return KeyNavigationDirection.KeyNavigation_None;
    }
    getAllFocusableChildren() {
        if (this.hasAttribute("navigation-query")) {
            console.error("deprecated navigation-query");
            let ret = Utils.toArray(this.querySelectorAll(this.getAttribute("navigation-query")));
            return ret;
        }
        else if (this.hasAttribute("vertical-navigation") && this.getAttribute("vertical-navigation") != "") {
            let ret = Utils.toArray(this.querySelectorAll(this.getAttribute("vertical-navigation")));
            return ret;
        }
        else if (this.hasAttribute("horizontal-navigation") && this.getAttribute("horizontal-navigation") != "") {
            let ret = Utils.toArray(this.querySelectorAll(this.getAttribute("horizontal-navigation")));
            return ret;
        }
        return [];
    }
    getKeyNavigationStayInside(keycode) {
        let attrib = this.getAttribute("navigation-stay-inside");
        switch (attrib) {
            case "down":
                if (keycode == KeyCode.KEY_DOWN)
                    return true;
                break;
            case "up":
                if (keycode == KeyCode.KEY_UP)
                    return true;
                break;
            case "left":
                if (keycode == KeyCode.KEY_LEFT)
                    return true;
                break;
            case "right":
                if (keycode == KeyCode.KEY_RIGHT)
                    return true;
                break;
            default: return this.hasAttribute("navigation-stay-inside");
        }
    }
    getKeyOrthogonalStayInside(keycode) {
        let attrib = this.getAttribute("orthogonal-stay-inside");
        switch (attrib) {
            case "down":
                if (keycode == KeyCode.KEY_DOWN)
                    return true;
                break;
            case "up":
                if (keycode == KeyCode.KEY_UP)
                    return true;
                break;
            case "left":
                if (keycode == KeyCode.KEY_LEFT)
                    return true;
                break;
            case "right":
                if (keycode == KeyCode.KEY_RIGHT)
                    return true;
                break;
            default: return this.hasAttribute("navigation-stay-inside");
        }
    }
    selectDefaultButton() {
        let button = this.getDefaultButton();
        if (bDebugKeyNavigation)
            console.warn("select default button", button);
        if (button) {
            button.focusByKeys(0);
        }
    }
    selectDefaultChildButton() {
        let button = this.getDefaultChildButton();
        if (bDebugKeyNavigation)
            console.warn("select default child button", button);
        if (button) {
            button.focusByKeys(0);
        }
    }
    getDefaultButton() {
        if (this.canBeSelectedWithKeys())
            return this;
        if (this.canBeSelected && !this.canBeSelectedWithKeys()) {
            return null;
        }
        else {
            return this.getDefaultChildButton();
        }
    }
    _getDefaultChildButton(reverse = false) {
        let defaultChild = UINavigation.findDefaultChildUIElement(this, reverse) ||
            UINavigation.findFocusedUIElement(this) ||
            UINavigation.findSelectedUIElement(this) ||
            UINavigation.findDefaultUIElement(this, reverse) ||
            UINavigation.findFocusableUIElement(this, reverse);
        if (defaultChild) {
            if (bDebugKeyNavigation) {
                console.warn("Found default child button", defaultChild);
                console.trace();
            }
            return defaultChild;
        }
        return null;
    }
    getLastDefaultChildButton() {
        return this._getDefaultChildButton(true);
    }
    getDefaultChildButton() {
        return this._getDefaultChildButton(false);
    }
    virtualScrollIntoView(elt) {
        (elt ? elt : this).dispatchEvent(new CustomEvent("virtualScrollIntoView", { bubbles: true }));
    }
    onButtonSelected(button) { }
    onButtonUnselected(button) { }
    onKeyUp(keycode) {
        let parent = this.parentElement;
        while (parent && parent["onKeyUp"] == null) {
            parent = parent.parentElement;
        }
        if (parent) {
            parent.onKeyUp(keycode);
        }
        return false;
    }
    onKeyDown(keycode) {
        if (!UINavigation.current || UINavigation.current != this) {
            if (this.getKeyNavigationDirection() == KeyNavigationDirection.KeyNavigation_Grid && [KeyCode.KEY_RIGHT, KeyCode.KEY_LEFT, KeyCode.KEY_UP, KeyCode.KEY_DOWN].includes(keycode)) {
                if (bDebugKeyNavigation) {
                    console.warn("********** GRID NAVIGATION *******", this);
                }
                let horizontal = [KeyCode.KEY_RIGHT, KeyCode.KEY_LEFT].includes(keycode);
                let currentGridColumn = (UINavigation.current ? UINavigation.current.globalGridColumn : ["0"]);
                let currentGridColumnEnd = (UINavigation.current ? UINavigation.current.globalGridColumnEnd : currentGridColumn);
                let currentGridColumnStr = currentGridColumn.toString();
                let currentGridRow = (UINavigation.current ? UINavigation.current.globalGridRow : ["0"]);
                let currentGridRowEnd = (UINavigation.current ? UINavigation.current.globalGridRowEnd : currentGridRow);
                let currentGridRowStr = currentGridRow.toString();
                let isCandidate = (elem) => {
                    if (elem == UINavigation.current) {
                        return false;
                    }
                    if (!elem.canBeSelectedWithKeys) {
                        return false;
                    }
                    if (!elem.canBeSelectedWithKeys()) {
                        if (bDebugKeyNavigation)
                            console.warn("cannot be selected with keys", elem);
                        return false;
                    }
                    let elemRows = elem.globalGridRow;
                    let elemRowsEnd = elem.globalGridRowEnd;
                    let elemColumn = elem.globalGridColumn;
                    let elemColumnEnd = elem.globalGridColumnEnd;
                    let nbToTest = horizontal ? Math.min(currentGridRow.length, elemRows.length) : Math.min(currentGridColumn.length, elemColumn.length);
                    let elemStartValue = (horizontal ? elemRows : elemColumn).slice(0, nbToTest).toString();
                    let elemEndValue = (horizontal ? elemRowsEnd : elemColumnEnd).slice(0, nbToTest).toString();
                    let currentStartValue = (horizontal ? currentGridRow : currentGridColumn).slice(0, nbToTest).toString();
                    let currentEndValue = (horizontal ? currentGridRowEnd : currentGridColumnEnd).slice(0, nbToTest).toString();
                    let contains = (currentStartValue >= elemStartValue && currentStartValue <= elemEndValue) || (elemStartValue >= currentStartValue && elemStartValue <= currentEndValue);
                    if (!contains) {
                        if (bDebugKeyNavigation) {
                            if (horizontal)
                                console.warn("different row", elem, "nbToTest " + nbToTest, "current : " + currentStartValue + "/" + currentEndValue, "elem : " + elemStartValue + "/" + elemEndValue);
                            else
                                console.warn("different column", elem, "nbToTest " + nbToTest, "current : " + currentStartValue + "/" + currentEndValue, "elem : " + elemStartValue + "/" + elemEndValue);
                        }
                        return false;
                    }
                    let elemTestStr = horizontal ? elem.globalGridColumn.toString() : elem.globalGridRow.toString();
                    let currentTestStr = horizontal ? currentGridColumnStr : currentGridRowStr;
                    if ((keycode == KeyCode.KEY_RIGHT || keycode == KeyCode.KEY_DOWN) && elemTestStr < currentTestStr) {
                        if (bDebugKeyNavigation)
                            console.warn("not on the right", elem);
                        return false;
                    }
                    else if ((keycode == KeyCode.KEY_LEFT || keycode == KeyCode.KEY_UP) && elemTestStr > currentTestStr) {
                        if (bDebugKeyNavigation)
                            console.warn("not on the left", elem);
                        return false;
                    }
                    if (UINavigation.current && UINavigation.current.isChildOf(elem)) {
                        if (bDebugKeyNavigation)
                            console.warn("parent of the current element", elem);
                        return false;
                    }
                    return true;
                };
                let allElems = null;
                let allCandidates = [];
                if (!allElems) {
                    let queryStr = "";
                    if (horizontal) {
                        queryStr = "[local-grid-column]";
                    }
                    else
                        queryStr = "[local-grid-row]";
                    let queryStrGroup = "";
                    if (this.hasAttribute("main-grid-group")) {
                        queryStrGroup = "[grid-group='" + this.getAttribute("main-grid-group") + "']";
                    }
                    else {
                        queryStrGroup = ":not([grid-group])";
                    }
                    queryStrGroup += ":not(.hide)";
                    queryStr += queryStrGroup + ",[local-grid]" + queryStrGroup;
                    allElems = Utils.toArray(this.querySelectorAll(queryStr));
                }
                for (let elem of allElems) {
                    if (!isCandidate(elem)) {
                        continue;
                    }
                    allCandidates.push(elem);
                }
                let order = (keycode == KeyCode.KEY_RIGHT || keycode == KeyCode.KEY_DOWN) ? 1 : -1;
                allCandidates = allCandidates.sort((a, b) => {
                    let aTest1 = horizontal ? a.globalGridColumn.toString() : a.globalGridRow.toString();
                    let bTest1 = horizontal ? b.globalGridColumn.toString() : b.globalGridRow.toString();
                    if (aTest1 < bTest1)
                        return order * -1;
                    if (aTest1 > bTest1)
                        return order * 1;
                    let aTest2 = horizontal ? a.globalGridRow.toString() : a.globalGridColumn.toString();
                    let bTest2 = horizontal ? b.globalGridRow.toString() : b.globalGridColumn.toString();
                    if (aTest2 < bTest2)
                        return 1;
                    if (aTest2 > bTest2)
                        return -1;
                    return 0;
                });
                if (allCandidates.length > 0) {
                    let buttonToSelect = allCandidates[0];
                    let isPartOf = (elem, parent) => {
                        if (elem.length < parent.length) {
                            return false;
                        }
                        for (let it = 0; it < parent.length; it++) {
                            if (elem[it] != parent[it]) {
                                return false;
                            }
                        }
                        return true;
                    };
                    for (let elem of allCandidates) {
                        if (horizontal) {
                            if (isPartOf(elem.globalGridColumn, UINavigation.current.globalGridColumn)) {
                                continue;
                            }
                            if (isPartOf(elem.globalGridColumn, buttonToSelect.globalGridColumn)) {
                                buttonToSelect = elem;
                            }
                        }
                        else {
                            if (isPartOf(elem.globalGridRow, UINavigation.current.globalGridRow))
                                continue;
                            if (isPartOf(elem.globalGridRow, buttonToSelect.globalGridRow)) {
                                buttonToSelect = elem;
                            }
                        }
                    }
                    this.previousButton = UINavigation.current;
                    if (buttonToSelect) {
                        if (bDebugKeyNavigation)
                            console.warn("buttonToSelect", buttonToSelect);
                        buttonToSelect.focusByKeys(keycode);
                        return true;
                    }
                    else if (this.getKeyNavigationStayInside(keycode)) {
                        if (bDebugKeyNavigation)
                            console.warn("no button to select + stay inside");
                    }
                    else {
                        if (bDebugKeyNavigation)
                            console.warn("no button to select");
                    }
                }
                else {
                    if (this.getKeyNavigationStayInside(keycode)) {
                        if (bDebugKeyNavigation)
                            console.warn("no button to select + stay inside");
                        return true;
                    }
                }
            }
            else if ([KeyCode.KEY_RIGHT, KeyCode.KEY_LEFT, KeyCode.KEY_UP, KeyCode.KEY_DOWN].includes(keycode) && (this.getKeyNavigationDirection() == KeyNavigationDirection.KeyNavigation_Vertical || this.getKeyNavigationDirection() == KeyNavigationDirection.KeyNavigation_Horizontal)) {
                if ((this.getKeyNavigationDirection() == KeyNavigationDirection.KeyNavigation_Vertical && [KeyCode.KEY_UP, KeyCode.KEY_DOWN].includes(keycode)) ||
                    (this.getKeyNavigationDirection() == KeyNavigationDirection.KeyNavigation_Horizontal && [KeyCode.KEY_RIGHT, KeyCode.KEY_LEFT].includes(keycode))) {
                    let selectedButton = UINavigation.current;
                    let buttonToSelect = null;
                    let buttons = this.getAllFocusableChildren();
                    if (bDebugKeyNavigation) {
                        console.warn("this", this);
                        console.warn("selectedButton", selectedButton);
                    }
                    if (buttons) {
                        if (bDebugKeyNavigation)
                            console.warn("buttons", buttons);
                        let previousButton = null;
                        for (let buttonH of buttons) {
                            let button = UIElement.getUIElement(buttonH);
                            if (!button || !button.canBeSelectedWithKeys()) {
                                if (bDebugKeyNavigation) {
                                    if (button)
                                        console.warn("dismissed ", button, "!forceNoKeyNavigation " + !button.forceNoKeyNavigation, "can be selected " + button.canBeSelected, "visible " + button.isVisible(), "enabled " + button.enabled, "no parent hidden " + !button.isOneParentHidden());
                                    else
                                        console.warn("dismissed ", button);
                                }
                                continue;
                            }
                            if (bDebugKeyNavigation)
                                console.warn("button", button);
                            switch (keycode) {
                                case KeyCode.KEY_UP:
                                case KeyCode.KEY_LEFT:
                                    if (button == selectedButton || button.isParentOf(selectedButton)) {
                                        buttonToSelect = previousButton;
                                    }
                                    else {
                                        if (bDebugKeyNavigation)
                                            console.warn("button is not a parent of selected ");
                                    }
                                    break;
                                case KeyCode.KEY_DOWN:
                                case KeyCode.KEY_RIGHT:
                                    if (previousButton && (previousButton == selectedButton || previousButton.isParentOf(selectedButton))) {
                                        buttonToSelect = button;
                                    }
                                    else {
                                        if (bDebugKeyNavigation)
                                            console.warn("previous button is not child of", previousButton, selectedButton);
                                    }
                                    break;
                            }
                            previousButton = button;
                            if (buttonToSelect)
                                break;
                        }
                        if (buttonToSelect) {
                            if (bDebugKeyNavigation)
                                console.warn("buttonToSelect", buttonToSelect);
                            buttonToSelect.focusByKeys(keycode);
                            selectedButton.blur();
                            return true;
                        }
                        if (this.getKeyNavigationStayInside(keycode)) {
                            if (bDebugKeyNavigation)
                                console.warn("no button to select + stay inside");
                            return true;
                        }
                        else {
                            if (bDebugKeyNavigation)
                                console.warn("no button to select");
                        }
                    }
                }
            }
        }
        let parent = this.parentElement;
        while (parent && parent["onKeyDown"] == null) {
            parent = parent.parentElement;
        }
        if (parent) {
            return parent.onKeyDown(keycode);
        }
        else {
            if (!this.getKeyNavigationStayInside(keycode))
                UINavigation.onKeyDownOnRoot(keycode);
        }
        return false;
    }
    get autoInside() { return this.hasAttribute("auto-inside"); }
    focusByKeys(keycode = -1) {
        if (!UINavigation.KeysMode)
            return;
        let defaultChild = this.getDefaultChildButton();
        if ((this.autoInside || !this.canBeSelectedWithKeys()) && defaultChild) {
            if ((this.getKeyNavigationDirection() == KeyNavigationDirection.KeyNavigation_Vertical && keycode == KeyCode.KEY_UP) ||
                (this.getKeyNavigationDirection() == KeyNavigationDirection.KeyNavigation_Horizontal && keycode == KeyCode.KEY_LEFT)) {
                let lastDefaultChild = this.getLastDefaultChildButton();
                if (lastDefaultChild)
                    lastDefaultChild.focusByKeys(keycode);
            }
            else
                defaultChild.focusByKeys(keycode);
        }
        else if (!this.canBeSelectedWithKeys()) {
            console.error(this, " This element is not focusable by keys and have no default child (focusable), need to be fixed");
        }
        else {
            this.focus();
            this.dispatchEvent(new Event("focusbykeys", { bubbles: true }));
            let eltToScroll = this;
            if (this.hasAttribute("scroll-top-target")) {
                if (document.querySelector(this.getAttribute('scroll-top-target'))) {
                    let newEltToScroll = this.closest(this.getAttribute('scroll-top-target'));
                    if (newEltToScroll && newEltToScroll instanceof UIElement) {
                        if (newEltToScroll.isVisible()) {
                            eltToScroll = newEltToScroll;
                            if (bDebugKeyNavigation)
                                console.warn("Scroll Top Target forced : ", eltToScroll);
                        }
                    }
                    else if (bDebugKeyNavigation) {
                        console.warn(this, " have a non UI Element as Scroll Top Target", this.getAttribute('scroll-top-target'), newEltToScroll);
                    }
                }
            }
            this.virtualScrollIntoView(eltToScroll);
            let parent = this.parentElement;
            while (parent) {
                if (UIElement.getUIElement(parent)) {
                    parent.onButtonSelected(this);
                    return;
                }
                parent = parent.parentElement;
            }
        }
    }
}
window.customElements.define("ui-element", UIElement);
Coherent.on("SetPageTitle", function (title) {
    if (document)
        document.title = title;
});
let g_checkComponentsTimeout = -1;
class TemplateElement extends UIElement {
    constructor() {
        super();
        this.created = false;
        this.onResourceLoaded = (e) => {
            if (this.convertPath(e.detail) == this.convertPath(this.getAttribute("href")))
                this.Instanciate();
        };
        this.instantciatePopupToolbar = () => {
            let localPopup = document.createElement('local-popup');
            this.appendChild(localPopup);
            this.classList.add('local-popup-container');
        };
        this.callbackCreated = () => {
            this.dispatchEvent(new Event("created"));
        };
    }
    get templateID() { return ""; }
    ;
    Instanciate() {
        if (this.templateID == undefined || this.templateID == "")
            return null;
        var templateImport = InstanciateTemplate2(this.templateID, this);
        if (!templateImport) {
            console.warn("INSTANCIATE FAILED!!");
            return;
        }
        let tElement = document.getElementById(this.templateID);
        TemplateElement.copyAttributes(tElement, this);
        this.appendChild(templateImport);
        window.clearTimeout(g_checkComponentsTimeout);
        g_checkComponentsTimeout = window.setTimeout(() => {
            g_ComponentMgr.checkAllComponents();
        });
    }
    querySelectorH(str) {
        return this.querySelector(str);
    }
    appendContent(element) {
        let destination = this.querySelector('[content-slot]') ? this.querySelector('[content-slot]') : this;
        destination.appendChild(element);
    }
    static copyAttributes(from, to) {
        for (let attribute of from.attributes) {
            if (attribute.name != "id" && attribute.name != "type") {
                if (attribute.name === "class") {
                    to.classList.add(...from.classList);
                }
                else if (!to.hasAttribute(attribute.name))
                    to.setAttribute(attribute.name, attribute.value);
            }
        }
    }
    convertPath(path) {
        return path.split("/").pop().replace(".html", "").replace(".js", "").toUpperCase();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    isTransparent() {
        if (this.hasAttribute("is-transparent"))
            return true;
        return false;
    }
    connectedCallback() {
        if (!this["Instanciate"]) {
            console.error("UI IS BROKEN (" + this.tagName + "), forcing a reload of the page " + document.URL);
            window.location.reload();
            return;
        }
        if (this.created == true)
            return;
        this.Instanciate();
        this.setAttribute("created", "true");
        this.created = true;
        super.connectedCallback();
        if (!this.isTransparent())
            this.setAttribute("data-input-group", this.tagName);
        if (this.hasAttribute('has-popup-toolbar')) {
            Include.addImports(["/templates/localPopup/localPopup.html"], this.instantciatePopupToolbar);
        }
        setTimeout(this.callbackCreated);
    }
}
(function (TemplateElement) {
    function call(obj, fnc, ...args) {
        if (obj) {
            if (obj.hasAttribute("created")) {
                fnc.call(fnc, ...args);
            }
            else {
                obj.addEventListener("created", fnc.bind(fnc, ...args), { once: true });
            }
        }
    }
    TemplateElement.call = call;
    function callNoBinding(obj, callback) {
        if (obj.hasAttribute("created")) {
            callback();
        }
        else {
            obj.addEventListener("created", callback, { once: true });
        }
    }
    TemplateElement.callNoBinding = callNoBinding;
})(TemplateElement || (TemplateElement = {}));
window.customElements.define("template-element", TemplateElement);
class UIMarquee extends UIElement {
    constructor() {
        super(...arguments);
        this.updateScrollBehaviour = () => {
            this.classList.toggle('has-ellipsis', this.needsEllipsis());
        };
        this.updateScrollAnimation = () => {
            if (!this.needsTooltip() && !this.manual) {
                requestAnimationFrame(() => {
                    this.startScrollAnimation();
                    requestAnimationFrame(this.startScrollAnimation);
                });
            }
        };
        this.updateSavedSizes = () => {
            this.m_savedOffsetWidth = this.offsetWidth;
            this.m_savedContentWidth = this.scrollWidth;
            if (this.m_animation && this.m_animation.playing) {
                this.m_animation.stop();
                this.m_animation = this.scrollAnimation();
                this.m_animation.play();
            }
            else {
                this.m_animation.stop();
                this.m_animation = this.scrollAnimation();
            }
        };
        this.setText = (text) => {
            let span = this.querySelector('span');
            if (!span) {
                span = document.createElement('span');
                this.appendChild(span);
            }
            span.textContent = text;
            if (this.noSizeCheck) {
                this.updateSavedSizes();
            }
        };
        this.setContent = (value) => {
            var span = this.querySelector('span');
            if (!span) {
                span = document.createElement('span');
                this.appendChild(span);
            }
            span.innerText = value;
        };
        this.startScrollAnimation = () => {
            if (this.needsTooltip())
                return;
            if (!this.noSizeCheck || !this.m_savedOffsetWidth) {
                this.m_savedOffsetWidth = this.offsetWidth;
            }
            let sizeChanged = !this.m_savedContentWidth || this.m_savedContentWidth != this.scrollWidth;
            if (!this.noSizeCheck || !this.m_savedContentWidth) {
                this.m_savedContentWidth = this.scrollWidth;
            }
            if (this.m_animation && (this.noSizeCheck || !sizeChanged)) {
                this.m_animation.stop();
                if (this.m_savedOffsetWidth < this.m_savedContentWidth) {
                    this.m_animation.play();
                }
            }
            else {
                if (this.m_savedOffsetWidth < this.m_savedContentWidth) {
                    this.m_animation = this.scrollAnimation();
                    this.m_animation.play();
                }
                if (!this.noSizeCheck) {
                    this.m_savedContentWidth = this.scrollWidth;
                }
            }
        };
        this.stopScrollAnimation = () => {
            if (this.m_animation) {
                this.m_animation.stop();
            }
        };
    }
    connectedCallback() {
        this.addEventListener('virtualScrollSizeUpdate', this.updateScrollAnimation);
        window.addEventListener("updateExternal:showTooltips", this.updateScrollBehaviour);
        requestAnimationFrame(() => {
            this.m_savedOffsetWidth = this.offsetWidth;
            this.updateScrollAnimation();
            this.updateScrollBehaviour();
        });
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener("updateExternal:showTooltips", this.updateScrollBehaviour);
    }
    needsTooltip() {
        return this.needsEllipsis() && this.offsetWidth < this.scrollWidth;
    }
    needsEllipsis() {
        return (g_externalVariables.showTooltips && !this.closest('[no-child-tooltip]'));
    }
    onVisibilityChange(visible) {
        this.updateScrollAnimation();
    }
    static get observedAttributes() {
        return super.observedAttributes.concat(["manual"]);
    }
    get noSizeCheck() {
        return this.hasAttribute('no-size-check');
    }
    get manual() {
        return this.hasAttribute('manual');
    }
    set manual(bool) {
        if (bool) {
            this.setAttribute('manual', '');
        }
        else {
            this.removeAttribute('manual');
        }
    }
    scrollAnimation() {
        let diff = this.m_savedContentWidth - this.m_savedOffsetWidth;
        let tl = new UITimeline();
        let duration = 1550 + 16 * diff;
        if (diff == 0)
            return null;
        tl.add({
            elements: this.querySelector('span'),
            duration: duration,
            iterations: -1,
            properties: {
                transform: [
                    { percent: 0, value: `translate(0px)` },
                    { percent: 8, value: `translate(0px)` },
                    { percent: 90, value: `translate(${-diff}px)` },
                    { percent: 100, value: `translate(${-diff}px)` },
                ]
            }
        });
        return tl;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (oldValue != newValue && this.isConnected) {
            switch (name) {
                case "manual":
                    this.updateScrollBehaviour();
                    break;
            }
        }
    }
}
Include.addImports([
    "/JS/animation/animation.js"
], () => {
    window.customElements.define("ui-marquee", UIMarquee);
});
class LabelizeElement extends UIElement {
    constructor() {
        super(...arguments);
        this.updateText = () => {
            if (this.key && this.key != "") {
                let trans = Utils.Translate(this.key);
                if (trans == undefined || trans == null)
                    requestAnimationFrame(this.updateText);
                else {
                    this.innerHTML = trans;
                }
            }
        };
    }
    static get observedAttributes() { return super.observedAttributes.concat(['key']); }
    ;
    get key() { return this.getAttribute('key'); }
    set key(value) { this.setAttribute('key', value); }
    connectedCallback() {
        super.connectedCallback();
        this.updateText();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (name != "key")
            return;
        if (newValue == oldValue)
            return;
        if (!this.key)
            return;
        if (!this.isConnected)
            return;
        this.updateText();
    }
}
window.customElements.define("l10n-label", LabelizeElement);
checkAutoload();
class UIImageElement extends TemplateElement {
    constructor() {
        super();
        this.m_src = "";
        this.m_transitionTime = 0.3;
        this.onImageLoaded = () => {
            if (this.m_mainElem) {
                if (this.m_imageElement.complete) {
                    this.m_mainElem.classList.remove("ImageLoading");
                    clearTimeout(this.m_timeout);
                    if (!this.transition) {
                        this.updateBackground();
                    }
                    else {
                        this.style.setProperty("--transitionTime", this.transitionTime + "s");
                        this.m_timeout = setTimeout(this.updateBackground, this.transitionTime * 1000);
                    }
                    this.dispatchEvent(new Event('imageLoaded'));
                    this.sendSizeUpdate();
                }
            }
        };
        this.onImageError = () => {
            this.dispatchEvent(new Event('loadFail'));
        };
        this.updateBackground = () => {
            if (this.m_backBuffer && this.m_imageElement) {
                this.m_backBuffer.src = this.m_imageElement.src;
                if (!this.noBackElement) {
                    this.m_backBuffer.classList.add("hide");
                }
                else if (!this.transition)
                    this.m_backBuffer.classList.add("invisible");
            }
        };
    }
    get transition() { return !this.hasAttribute("no-transition"); }
    get noBackElement() { return this.hasAttribute("no-back-element"); }
    SetData(data) {
        if (typeof (data) == typeof ("")) {
            this.src = encodeURI(data);
        }
        else if (typeof (data) == typeof (null)) {
            this.LoadContentURL(data.image, data.ContentHTML, data.ContentTag, data.ContentData);
        }
    }
    LoadContentURL(srcImage, urlContent, contentTag, contentData) {
        this.src = encodeURI(srcImage);
        console.assert(this.m_mainContentElement.childElementCount <= 1, "There is " + this.m_mainContentElement.childElementCount + " children (too many)");
        if (this.m_mainContentElement.childElementCount == 0 || this.m_mainContentElement.firstElementChild.tagName !== contentTag.toUpperCase()) {
            Utils.RemoveAllChildren(this.m_mainContentElement);
            if (urlContent && urlContent != "") {
                Include.addImports([urlContent], () => {
                    let container = document.createElement(contentTag);
                    this.m_mainContentElement.appendChild(container);
                    TemplateElement.call(container, () => {
                        if (container.setAnyData) {
                            container.setAnyData(contentData);
                        }
                    });
                });
            }
        }
        else {
            let container = this.m_mainContentElement.firstElementChild;
            TemplateElement.call(container, () => {
                container.setAnyData(contentData);
            });
        }
    }
    clear() {
        this.src = "";
        this.m_backBuffer.src = "";
    }
    set src(_src) {
        if (this.m_src != _src) {
            this.m_src = _src;
            if (this.m_mainElem) {
                if (this.transition && _src)
                    this.m_mainElem.classList.add("ImageLoading");
                Utils.RemoveAllChildren(this.m_mainContentElement);
                if (_src != "")
                    this.m_imageElement.src = _src + "?page='" + window.document.title + "'";
                else {
                    this.m_imageElement.src = "";
                    this.m_backBuffer.src = "";
                }
                if (!this.noBackElement)
                    this.m_backBufferElement.classList.remove("invisible");
            }
        }
    }
    get src() {
        return this.m_src;
    }
    get transitionTime() {
        let attribute = this.getAttribute("transitiontime");
        if (attribute) {
            this.m_transitionTime = parseFloat(attribute);
        }
        return this.m_transitionTime;
    }
    set transitionTime(n) {
        this.m_transitionTime = n;
        this.style.setProperty("--transitionTime", this.transitionTime + "s");
        this.setAttribute("transitiontime", n.toString());
    }
    connectedCallback() {
        super.connectedCallback();
        if (!this.m_backBufferElement) {
            this.m_mainElem = document.createElement("div");
            this.m_mainElem.classList.add("MainElem");
            this.m_imageElement = document.createElement("img");
            this.m_imageElement.classList.add("MainImage");
            this.m_mainElem.appendChild(this.m_imageElement);
            this.m_mainContentElement = document.createElement("div");
            this.m_mainContentElement.classList.add("Content");
            this.m_mainElem.appendChild(this.m_mainContentElement);
            this.insertBefore(this.m_mainElem, this.firstChild);
            this.m_imageElement.addEventListener("load", this.onImageLoaded);
            this.m_imageElement.addEventListener("error", this.onImageError);
            this.m_backBufferElement = document.createElement("div");
            this.m_backBufferElement.classList.add("BackElem");
            this.m_backBuffer = document.createElement("img");
            this.m_backBuffer.classList.add("BackBuffer");
            this.m_backBufferElement.appendChild(this.m_backBuffer);
            this.insertBefore(this.m_backBufferElement, this.firstChild);
            if (this.getAttribute('src')) {
                this.src = this.getAttribute('src');
            }
            if (this.m_mainElem) {
                if (this.m_src)
                    this.m_mainElem.classList.add("ImageLoading");
                this.m_imageElement.src = this.m_src + "?page='" + window.document.title + "'";
                if (!this.noBackElement)
                    this.m_backBufferElement.classList.remove("invisible");
            }
        }
    }
}
window.customElements.define("ui-image", UIImageElement);
var ViewListener;
(function (ViewListener_1) {
    class ListenerEventHandler {
    }
    class ViewListener {
        constructor(name) {
            this.connected = false;
            this.CheckCoherentEvent = (listenerName, ...args) => {
                var testListenerName = listenerName.toUpperCase();
                if (testListenerName == this.m_name) {
                    engine.beginProfileEvent(testListenerName);
                    var eventName = args[0];
                    if (this.m_handlers) {
                        let i = 0;
                        do {
                            let h = this.m_handlers[i];
                            if (h.name == eventName) {
                                let slicedArgs = args.slice(1);
                                if (h.context)
                                    h.callback(h.context, ...slicedArgs);
                                else
                                    h.callback(...slicedArgs);
                            }
                            ++i;
                        } while (this.m_handlers && i < this.m_handlers.length);
                    }
                    engine.endProfileEvent();
                }
            };
            this.unregister = () => {
                if (this.m_handlers) {
                    for (let handler of this.m_handlers) {
                        handler.globalEventHandler.clear();
                    }
                    this.m_handlers = null;
                }
                ViewListener_1.g_ViewListenersMgr.onUnregister(this.m_name, this);
            };
            this.onEventToAllSubscribers = (eventName, ...args) => {
                let argsObj = [];
                for (let arg of args) {
                    let obj = JSON.parse(arg);
                    argsObj.push(obj);
                }
                Coherent.trigger(eventName, ...argsObj);
            };
            this.m_name = name.toUpperCase();
            Coherent.on("EVENT_FROM_VIEW_LISTENER", this.CheckCoherentEvent);
            this.on("ON_EVENT_TO_ALL_SUBSCRIBERS", this.onEventToAllSubscribers);
        }
        onGlobalEvent(eventName, ...args) {
            for (let handler of this.m_handlers) {
                if (handler.name == eventName) {
                    if (handler.context)
                        handler.callback(handler.context, ...args);
                    else
                        handler.callback(...args);
                }
            }
        }
        off(name, callback, context) {
            if (this.m_handlers) {
                for (let handler of this.m_handlers) {
                    if (handler.name == name && handler.callback == callback && handler.context == context) {
                        handler.globalEventHandler.clear();
                    }
                }
            }
            Coherent.off(name, callback, context);
            if (!this.m_handlers)
                return;
            for (var i = this.m_handlers.length - 1; i >= 0; i--) {
                if (this.m_handlers[i].name == name) {
                    if (this.m_handlers[i].callback == callback) {
                        if (this.m_handlers[i].context == context) {
                            this.m_handlers.splice(i, 1);
                        }
                    }
                }
            }
        }
        on(name, callback, context) {
            if (!this.m_handlers)
                this.m_handlers = [];
            for (let handle of this.m_handlers) {
                if (handle.name === name && handle.callback === callback) {
                    if ((!context && !handle.context) || (context && handle.context && context === handle.context)) {
                        return;
                    }
                }
            }
            this.m_handlers.push({
                name: name,
                callback: callback,
                context: context,
                globalEventHandler: Coherent.on(name, this.onGlobalEvent.bind(this, name))
            });
        }
        call(name, ...args) {
            return Coherent.call(name, ...args);
        }
        trigger(name, ...args) {
            if (bDebugListeners) {
                console.warn("TRIGGER " + name, args);
            }
            Coherent.trigger("EVENT_TO_VIEW_LISTENER", this.m_name, name, ...args);
        }
        triggerToAllSubscribers(event, ...args) {
            let argsJson = [];
            for (let arg of args) {
                let json = JSON.stringify(arg);
                argsJson.push(json);
            }
            Coherent.trigger("TRIGGER_EVENT_TO_ALL_SUBSCRIBERS", this.m_name, event, ...argsJson);
        }
    }
    ViewListener_1.ViewListener = ViewListener;
    class ViewListenerArray {
        constructor() {
            this.array = [];
        }
    }
    class ViewListenerMgr {
        constructor() {
            this.m_hash = {};
            this.OnListenerRegistered = (name) => {
                if (!this.m_hash)
                    return;
                let names = Object.getOwnPropertyNames(this.m_hash);
                for (let name of names) {
                    let vlArray = this.m_hash[name];
                    if (vlArray.name == name) {
                        let registeredViewListeners = vlArray.array;
                        if (registeredViewListeners) {
                            for (let i = 0; i < registeredViewListeners.length; i++) {
                                let viewListener = registeredViewListeners[i];
                                if (viewListener) {
                                    if (viewListener.m_onConnected) {
                                        viewListener.connected = true;
                                        setTimeout(() => {
                                            if (viewListener.m_onConnected) {
                                                viewListener.m_onConnected();
                                                viewListener.m_onConnected = null;
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            };
            Coherent.on("VIEW_LISTENER_REGISTERED", this.OnListenerRegistered);
        }
        onRegister(name, vl) {
            let vlArray = null;
            if (!this.m_hash.hasOwnProperty(name)) {
                vlArray = new ViewListenerArray();
                vlArray.name = name;
                this.m_hash[name] = vlArray;
            }
            this.m_hash[name].array.push(vl);
        }
        getListenerByName(name) {
            let listeners = this.m_hash[name];
            return listeners && listeners.array.length > 0 ? listeners.array[0] : null;
        }
        onUnregister(name, vl, force = false) {
            if (this.m_hash.hasOwnProperty(name)) {
                let registered = this.m_hash[name];
                if (registered.array.length > 0) {
                    for (let i = registered.array.length - 1; i >= 0; i--) {
                        if (vl.urlCaller == window.location.pathname) {
                            let res = registered.array[i] == vl;
                            if (res) {
                                registered.array.splice(i, 1);
                            }
                        }
                    }
                    if (registered.array.length == 0 || force) {
                        Coherent.trigger("REMOVE_VIEW_LISTENER", name, window.location.pathname);
                    }
                }
            }
        }
    }
    ViewListener_1.ViewListenerMgr = ViewListenerMgr;
    ViewListener_1.g_ViewListenersMgr = new ViewListenerMgr();
})(ViewListener || (ViewListener = {}));
function RegisterViewListenerT(name, callback = null, type, requiresSingleton = false) {
    var register = function (url) {
        if (closed) {
            return;
        }
        var currentLocation = window.location;
        if (url == "html_ui" + currentLocation.pathname) {
            if (bDebugLoading)
                LogCallstack("register " + name + " url : " + currentLocation.pathname);
            Coherent.trigger("ADD_VIEW_LISTENER", name, currentLocation.pathname);
        }
    };
    let existingListener = ViewListener.g_ViewListenersMgr.getListenerByName(name);
    if (requiresSingleton && existingListener) {
        if (existingListener.connected) {
            setTimeout(() => {
                if (callback)
                    callback();
            });
        }
        else {
            let existingCB = existingListener.m_onConnected;
            let callbackWrapper = () => {
                if (callback)
                    callback();
                if (existingCB)
                    existingCB();
            };
            existingListener.m_onConnected = callbackWrapper;
        }
        return existingListener;
    }
    else {
        let eventHandler = null;
        if (Coherent["isViewLoaded"] === true) {
            if (!existingListener) {
                if (bDebugLoading)
                    console.warn("Register because view is already loaded");
                register("html_ui" + window.location.pathname);
            }
            else {
                if (callback)
                    setTimeout(() => callback());
            }
        }
        else if (!existingListener) {
            if (bDebugLoading)
                LogCallstack("***** Add ON_VIEW_LOADED event listener for " + name);
            eventHandler = Coherent.on("ON_VIEW_LOADED", register);
        }
        let ret = new type(name);
        ret.m_onConnected = callback;
        ret.urlCaller = window.location.pathname;
        if (window.top != window) {
            window.document.addEventListener("onClose", function () {
                if (ret.urlCaller == window.location.pathname) {
                    console.warn("ON CLOSE !" + window.location.pathname);
                    ret.unregister();
                    if (eventHandler)
                        eventHandler.clear();
                }
            });
        }
        ViewListener.g_ViewListenersMgr.onRegister(name, ret);
        if (callback && EDITION_MODE()) {
            setTimeout(() => callback());
        }
        return ret;
    }
}
function RegisterViewListener(name, callback = null, requiresSingleton = false) {
    return RegisterViewListenerT(name, callback, ViewListener.ViewListener, requiresSingleton);
}
class Name_Z {
    constructor(str, eventHandler = null) {
        this.idLow = 0;
        this.idHigh = 0;
        this.__Type = "Name_Z";
        this.originalStr = str;
        this.RequestNameZ(eventHandler);
    }
    refresh() {
        this.RequestNameZ(null);
    }
    static isValid(a) {
        if (!a)
            return false;
        if (a.str != "") {
            return a.idHigh != 0 || a.idLow != 0;
        }
        return true;
    }
    static compare(a, b) {
        if (!a || !b)
            return false;
        if (!Name_Z.isValid(a))
            console.error("Comparing A an invalid string " + a.originalStr + "/" + a.str);
        if (!Name_Z.isValid(b))
            console.error("Comparing B an invalid string " + b.originalStr + "/" + b.str);
        return a.idLow == b.idLow && a.idHigh == b.idHigh;
    }
    static compareStr(a, b) {
        if (!a)
            return false;
        if (!Name_Z.isValid(a))
            console.error("Comparing A an invalid string " + a.originalStr + "/" + a.str);
        var bAsName = new Name_Z(b);
        return a.idLow == bAsName.idLow && a.idHigh == bAsName.idHigh;
    }
    RequestNameZ(eventHandler = null) {
        if (this.originalStr) {
            if (window.top["g_nameZObject"]) {
                let ret = window.top["g_nameZObject"].GetNameZ(this.originalStr);
                this.idLow = ret.idLow;
                this.idHigh = ret.idHigh;
                this.str = ret.str;
                if (eventHandler) {
                    eventHandler();
                }
            }
            else {
                requestAnimationFrame(this.RequestNameZ.bind(this, eventHandler));
                Coherent.on("Ready", this.RequestNameZ.bind(this, eventHandler));
            }
        }
    }
}
Coherent.on("FORCE_BLUR_ALL", () => {
    if (document.activeElement)
        document.activeElement.blur();
});
function checkAutoload(forcedUrl = null) {
    var url = window.document.currentScript["src"];
    if (forcedUrl)
        url = forcedUrl;
    window.document.dispatchEvent(new CustomEvent("ResourceLoaded", { detail: url }));
}
function EaseInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1)
        return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
}
;
function ScrollHTo(element, to, duration) {
    var start = element.scrollLeft, change = to - start, currentTime = 0, increment = 20;
    var animateScroll = function () {
        currentTime += increment;
        var val = EaseInOutQuad(currentTime, start, change, duration);
        element.scrollLeft = val;
        if (currentTime < duration) {
            setTimeout(animateScroll, increment);
        }
    };
    animateScroll();
}
function ScrollVTo(element, to, duration) {
    var start = element.scrollTop, change = to - start, currentTime = 0, increment = 20;
    var animateScroll = function () {
        currentTime += increment;
        var val = EaseInOutQuad(currentTime, start, change, duration);
        element.scrollTop = val;
        if (currentTime < duration) {
            setTimeout(animateScroll, increment);
        }
    };
    animateScroll();
}
function GetViewUrl() {
    var url = new URL(window.document.URL);
    return 'html_ui' + url.pathname;
}
var EResizeType;
(function (EResizeType) {
    EResizeType[EResizeType["NONE"] = 0] = "NONE";
    EResizeType[EResizeType["X"] = 1] = "X";
    EResizeType[EResizeType["Y"] = 2] = "Y";
    EResizeType[EResizeType["BOTH"] = 3] = "BOTH";
    EResizeType[EResizeType["RATIO"] = 4] = "RATIO";
    EResizeType[EResizeType["COUNT"] = 5] = "COUNT";
})(EResizeType || (EResizeType = {}));
class ResizeHandler {
    constructor(element, handleByGame) {
        this._resizeStartCallbacks = [];
        this._resizeUpdateCallbacks = [];
        this._resizeEndCallbacks = [];
        this._resizeHandleSize = 10;
        this._handleByGame = false;
        this.handleMouseOut = () => {
            if (!this.resizing) {
                if (!this._handleByGame) {
                    Cursor.unsetCursor();
                }
            }
        };
        this.startResize = (e) => {
            this.resizing = true;
            this._startX = e.clientX;
            this._startY = e.clientY;
            this._startClientRect = this.element.getBoundingClientRect();
            this._startRight = window.innerWidth - this._startClientRect.right;
            this.element.classList.add('Dragging');
            this._currentHandle = e.currentTarget;
            document.documentElement.addEventListener('mousemove', this.resizeUpdate, false);
            document.documentElement.addEventListener('mouseup', this.resizeEnd, false);
            if (this._resizeStartCallbacks.length > 0)
                this._resizeStartCallbacks.forEach(callback => callback(e));
            let resizeDirection = EResizeType.NONE;
            if (this._currentHandle.classList.contains('resize-handle__x-left') || this._currentHandle.classList.contains('resize-handle__x-right')) {
                resizeDirection = EResizeType.X;
            }
            else if (this._currentHandle.classList.contains('resize-handle__y')) {
                resizeDirection = EResizeType.Y;
            }
            else if (this._currentHandle.classList.contains('resize-handle__corner')) {
                resizeDirection = EResizeType.BOTH;
            }
            Coherent.trigger("START_RESIZE_ELEMENT", this.element.id, resizeDirection);
        };
        this.resizeUpdate = (e) => {
            if (this._currentHandle.classList.contains('resize-handle__x-left') || this._currentHandle.classList.contains('resize-handle__x-right')) {
                this.updateResizeX(e);
            }
            else if (this._currentHandle.classList.contains('resize-handle__y')) {
                this.updateResizeY(e);
            }
            else if (this._currentHandle.classList.contains('resize-handle__corner')) {
                this.updateResizeX(e);
                this.updateResizeY(e);
            }
            if (this._resizeUpdateCallbacks.length > 0)
                this._resizeUpdateCallbacks.forEach(callback => callback(e));
            this.element.dispatchEvent(new Event('onResizeElement'));
        };
        this.updateResizeX = (e) => {
            if (this._handleByGame) {
                this.element.style.width = "100vw";
                return;
            }
            let minWidth = this.element._minWidth != null ? (this.element._minWidth / 100) * window.virtualHeight : 0;
            let currentWidth = this._currentHandle.classList.contains('resize-handle__x-left') ? (this._startClientRect.width - e.clientX + this._startX) : (this._startClientRect.width + e.clientX - this._startX);
            this.element.style.width = Math.round(Math.max(minWidth, currentWidth)) + 'px';
            if (this._currentHandle.classList.contains('resize-handle__x-left')) {
                if (parseInt(this.element.style.left) >= 0 && this.element.style.right === 'auto') {
                    let maxLeft = this._startClientRect.left + (this._startClientRect.width - minWidth);
                    this.element.style.left = Utils.getVh(Math.min(maxLeft, (this._startClientRect.left + e.clientX - this._startX)) * 100 / window.innerHeight);
                }
            }
            else if (this.element.style.left === 'auto' || parseInt(this.element.style.right) >= 0) {
                let maxRight = this._startRight + (this._startClientRect.width - minWidth);
                this.element.style.right = Utils.getVh(Math.min(maxRight, this._startRight - (e.clientX - this._startX)) * 100 / window.innerHeight);
            }
        };
        this.updateResizeY = (e) => {
            if (this._handleByGame) {
                this.element.style.height = "100vh";
                return;
            }
            let minHeight = this.element._minHeight != null ? (this.element._minHeight / 100) * window.virtualHeight : 0;
            this.element.style.height = Math.max(minHeight, (this._startClientRect.height + e.clientY - this._startY)) + 'px';
            if (this.element.style.top === 'auto' || parseInt(this.element.style.bottom) >= 0) {
                this.element.style.bottom = Utils.getVh((window.innerHeight - (this._startClientRect.top + this._startClientRect.height + e.clientY - this._startY)) * 100 / window.innerHeight);
            }
        };
        this.resizeEnd = (e) => {
            this.resizing = false;
            document.documentElement.removeEventListener('mousemove', this.resizeUpdate);
            document.documentElement.removeEventListener('mouseup', this.resizeEnd);
            saveElementPosition(this.element);
            if (!this._handleByGame) {
                Cursor.unsetCursor();
            }
            this.element.classList.remove('Dragging');
            this.element.dispatchEvent(new Event('endResizeElement'));
            if (!this._handleByGame) {
                setElementPosition(this.element);
            }
            if (this._resizeEndCallbacks.length > 0)
                this._resizeEndCallbacks.forEach(callback => callback(e));
            Coherent.trigger("END_RESIZE_ELEMENT", this.element.id);
        };
        this.element = element;
        Include.addScript("/JS/dataStorage.js");
        this._handleByGame = handleByGame;
        let direction = this.element.getAttribute('resize');
        switch (direction) {
            case "x":
                this.initResizeX();
                this._type = EResizeType.X;
                break;
            case "y":
                this.initResizeY();
                this._type = EResizeType.Y;
                break;
            case "none":
                this._type = EResizeType.NONE;
                this.removeResize();
                break;
            case "both":
            default:
                this.initResizeXY();
                this._type = EResizeType.BOTH;
                break;
        }
    }
    setResizeType(direction) {
        switch (direction) {
            case "x":
                this.initResizeX();
                this._type = EResizeType.X;
                break;
            case "y":
                this.initResizeY();
                this._type = EResizeType.Y;
                break;
            case "none":
                this._type = EResizeType.NONE;
                this.removeResize();
                break;
            case "both":
            default:
                this.initResizeXY();
                this._type = EResizeType.BOTH;
                break;
        }
    }
    initResizeX() {
        var XElement = this.element.querySelector('.resize-handle__x-left');
        if (XElement == null) {
            XElement = document.createElement('div');
            XElement.classList.add('resize-handle__x-left');
            this.element.appendChild(XElement);
            if (!this._handleByGame) {
                XElement.addEventListener('mouseenter', Cursor.setCursor.bind(this, MouseCursor.RESIZE_H), false);
            }
        }
        XElement.addEventListener('mousedown', this.startResize, false);
        XElement.addEventListener('mouseleave', this.handleMouseOut, false);
        var XElement2 = this.element.querySelector('.resize-handle__x-right');
        if (XElement2 == null) {
            XElement2 = document.createElement('div');
            XElement2.classList.add('resize-handle__x-right');
            this.element.appendChild(XElement2);
            if (!this._handleByGame) {
                XElement2.addEventListener('mouseenter', Cursor.setCursor.bind(this, MouseCursor.RESIZE_H), false);
            }
        }
        XElement2.addEventListener('mousedown', this.startResize, false);
        XElement2.addEventListener('mouseleave', this.handleMouseOut, false);
    }
    removeResize() {
        let x1 = this.element.querySelector('.resize-handle__x-left');
        if (x1)
            x1.parentElement.removeChild(x1);
        let x2 = this.element.querySelector('.resize-handle__x-right');
        if (x2)
            x2.parentElement.removeChild(x2);
        let y1 = this.element.querySelector('.resize-handle__y');
        if (y1)
            y1.parentElement.removeChild(y1);
        let xy = this.element.querySelector('.resize-handle__corner');
        if (xy)
            xy.parentElement.removeChild(xy);
    }
    initResizeY() {
        var YElement = this.element.querySelector('.resize-handle__y');
        if (YElement == null) {
            YElement = document.createElement('div');
            YElement.classList.add('resize-handle__y');
            this.element.appendChild(YElement);
            if (!this._handleByGame) {
                YElement.addEventListener('mouseenter', Cursor.setCursor.bind(this, MouseCursor.RESIZE_V), false);
            }
        }
        YElement.addEventListener('mousedown', this.startResize, false);
        YElement.addEventListener('mouseleave', this.handleMouseOut, false);
    }
    initResizeXY() {
        this.initResizeX();
        this.initResizeY();
        var XYElement = this.element.querySelector('.resize-handle__corner');
        if (XYElement == null) {
            XYElement = document.createElement('div');
            XYElement.classList.add('resize-handle__corner');
            this.element.appendChild(XYElement);
        }
        XYElement.addEventListener('mousedown', this.startResize, false);
        if (!this._handleByGame) {
            XYElement.addEventListener('mouseenter', Cursor.setCursor.bind(this, MouseCursor.RESIZE_HV), false);
            XYElement.addEventListener('mouseleave', Cursor.unsetCursor.bind(this), false);
        }
    }
    OnResizeStart(callback) {
        this._resizeStartCallbacks.push(callback);
    }
    OnResizeUpdate(callback) {
        this._resizeUpdateCallbacks.push(callback);
    }
    OnResizeEnd(callback) {
        this._resizeEndCallbacks.push(callback);
    }
    RemoveHandlers() {
        this._resizeStartCallbacks = [];
        this._resizeUpdateCallbacks = [];
        this._resizeEndCallbacks = [];
    }
}
class DragDropHandler {
    constructor(element, options) {
        this.canBeDragged = true;
        this._dragStartCallbacks = [];
        this._dragUpdateCallbacks = [];
        this._dragEndCallbacks = [];
        this.onResize = () => {
            this._bodyRect = this._body.getBoundingClientRect();
            this._maxLeft = this._bodyRect.right;
            this._maxTop = this._bodyRect.bottom;
            if (!this._options.handleByGame) {
                setElementPosition(this.element);
            }
        };
        this.checkCanDrag = (e) => {
            let canBeDragged = this.canBeDragged;
            let testElm = e.target;
            while (testElm && canBeDragged) {
                if (testElm.classList.contains("nodrag")) {
                    canBeDragged = false;
                }
                testElm = testElm.parentElement;
            }
            if (this._options.handleByGame) {
                Coherent.trigger("CAN_DRAG_ELEMENT", this.element.id, canBeDragged);
            }
        };
        this.leaveDrag = () => {
            Coherent.trigger("CAN_DRAG_ELEMENT", this.element.id, false);
        };
        this.startDrag = (e) => {
            let canBeDragged = this.canBeDragged;
            let testElm = e.target;
            while (testElm && canBeDragged) {
                if (testElm.classList.contains("nodrag")) {
                    canBeDragged = false;
                }
                testElm = testElm.parentElement;
            }
            if (canBeDragged) {
                this._bodyRect = this._body.getBoundingClientRect();
                this._maxLeft = this._bodyRect.right - this._bodyRect.left;
                this._maxTop = this._bodyRect.bottom - this._bodyRect.top;
                let eltRect = this.element.getBoundingClientRect();
                this._initialX = eltRect.left - this._bodyRect.left;
                this._initialY = eltRect.top - this._bodyRect.top;
                this._initialMouseX = e.clientX;
                this._initialMouseY = e.clientY;
                window.document.addEventListener('mouseup', this.dragEnd);
                window.document.addEventListener('mousemove', this.dragUpdate);
                this.element.classList.add("Dragging");
                if (!this._options.handleByGame) {
                    Cursor.setCursor(MouseCursor.DRAG);
                }
                else {
                    Coherent.trigger("START_DRAG_ELEMENT", this.element.id);
                }
                if (this._dragStartCallbacks.length > 0)
                    this._dragStartCallbacks.forEach(callback => callback(e));
            }
        };
        this.dragUpdate = (e) => {
            if (this._options && this._options.handleByGame) {
            }
            else {
                this._deltaX = this._initialMouseX - e.clientX;
                this._deltaY = this._initialMouseY - e.clientY;
                var rect = this.element.getBoundingClientRect();
                let posLeft = this._initialX - this._deltaX;
                let posTop = this._initialY - this._deltaY;
                if (posLeft <= 0) {
                    posLeft = 0;
                }
                if (posLeft >= (this._maxLeft - (this._options.boundByWidth ? rect.width : 0))) {
                    posLeft = this._maxLeft - (this._options.boundByWidth ? rect.width : 0);
                }
                if (posTop <= 0) {
                    posTop = 0;
                }
                if (posTop >= (this._maxTop - (this._options.boundByHeight ? rect.height : 0))) {
                    posTop = this._maxTop - (this._options.boundByHeight ? rect.height : 0);
                }
                this.element.style.right = "auto";
                this.element.style.bottom = 'auto';
                this.element.style.top = posTop + "px";
                this.element.style.left = posLeft + "px";
            }
            if (this._dragUpdateCallbacks.length > 0)
                this._dragUpdateCallbacks.forEach(callback => callback(e));
        };
        this.dragEnd = (e) => {
            this.element.classList.remove("Dragging");
            window.document.removeEventListener('mouseup', this.dragEnd);
            window.document.removeEventListener('mousemove', this.dragUpdate);
            if (this._options.saving && !this._options.handleByGame) {
                saveElementPosition(this.element);
                setElementPosition(this.element);
            }
            if (!this._options.handleByGame) {
                Cursor.unsetCursor();
            }
            Coherent.trigger("END_DRAG_ELEMENT", this.element.id);
            if (this._dragEndCallbacks.length > 0)
                this._dragEndCallbacks.forEach(callback => callback(e));
        };
        options = options || {};
        this._options = options;
        this._options.boundByWidth = options.boundByWidth === false ? false : true;
        this._options.boundByHeight = options.boundByHeight === false ? false : true;
        if (options.saving == null)
            options.saving = true;
        Include.addScript("/JS/dataStorage.js");
        this.element = element;
        if (!options.dragElement) {
            this.dragElement = element;
        }
        else {
            this.dragElement = options.dragElement;
        }
        this.element.classList.add("draggable");
        this._initialX = 0;
        this._initialY = 0;
        this._deltaX = 0;
        this._deltaY = 0;
        this._body = options.container ? options.container : window.document.body;
        this._bodyRect = this._body.getBoundingClientRect();
        this._maxLeft = this._bodyRect.right - this._bodyRect.left;
        this._maxTop = this._bodyRect.bottom - this._bodyRect.top;
        window.addEventListener('resize', this.onResize);
        this.dragElement.addEventListener("mousedown", this.startDrag);
        this.dragElement.addEventListener("mouseover", this.checkCanDrag);
        this.dragElement.addEventListener("mouseleave", this.leaveDrag);
    }
    release() {
        window.removeEventListener("resize", this.onResize);
        this.dragElement.removeEventListener("mousedown", this.startDrag);
        this.dragElement.removeEventListener("mouseover", this.checkCanDrag);
        this.dragElement.removeEventListener("mouseleave", this.leaveDrag);
        this.dragElement = null;
        this.element = null;
    }
    OnDragStart(callback) {
        this._dragStartCallbacks.push(callback);
    }
    OnDragUpdate(callback) {
        this._dragUpdateCallbacks.push(callback);
    }
    OnDragEnd(callback) {
        this._dragEndCallbacks.push(callback);
    }
    isDragging() {
        return this.element.classList.contains('Dragging');
    }
}
function saveElementPosition(element) {
    if (element.getAttribute('panel-id') != null || element.id != null) {
        let panelID = element.getAttribute('panel-id') || element.id;
        var width = document.getElementById(element.id).offsetWidth;
        if (width > 0) {
            width = width / Utils.getVirtualHeight() * 100;
            SetStoredData('LAYOUT_' + panelID + '_width', width.toString());
        }
        var height = document.getElementById(element.id).offsetHeight;
        if (height > 0 && !element.classList.contains('minimized')) {
            height = height / Utils.getVirtualHeight() * 100;
            SetStoredData('LAYOUT_' + panelID + '_height', height.toString());
        }
        var top = document.getElementById(element.id).offsetTop;
        if (top != null) {
            top = top / Utils.getVirtualHeight() * 100;
            SetStoredData('LAYOUT_' + panelID + '_top', top.toString());
        }
        var left = document.getElementById(element.id).offsetLeft;
        if (left != null) {
            left = left / Utils.getVirtualHeight() * 100;
            SetStoredData('LAYOUT_' + panelID + '_left', left.toString());
        }
    }
}
function eraseElementPosition(id) {
    DeleteStoredData(`LAYOUT_${id}_left`);
    DeleteStoredData(`LAYOUT_${id}_top`);
    DeleteStoredData(`LAYOUT_${id}_width`);
    DeleteStoredData(`LAYOUT_${id}_height`);
}
function setElementWidth(element) {
    if (this._options && this._options.handleByGame) {
        element.style.width = "100vw";
        return;
    }
    let panelID = element.getAttribute('panel-id') || element.id;
    let storedWidth = GetStoredData('LAYOUT_' + panelID + '_width');
    let widthNb = storedWidth ? parseFloat(storedWidth) : null;
    if (widthNb != null && element.getAttribute('resize')) {
        element.style.width = Utils.getVh(widthNb);
    }
    if (widthNb == null) {
        let style = getComputedStyle(element);
        let defaultWidth = style.getPropertyValue('--defaultWidth');
        if (defaultWidth.length > 0) {
            element.style.width = defaultWidth;
        }
    }
}
function setElementPosition(element) {
    if (element.id) {
        let panelID = element.getAttribute('panel-id') || element.id;
        let storedWidth = GetStoredData('LAYOUT_' + panelID + '_width'), storedHeight = GetStoredData('LAYOUT_' + panelID + '_height'), storedTop = GetStoredData('LAYOUT_' + panelID + '_top'), storedLeft = GetStoredData('LAYOUT_' + panelID + '_left');
        let elementDiv = document.getElementById(element.id);
        let widthNb = storedWidth ? parseFloat(storedWidth) : null;
        let heightNb = storedHeight ? parseFloat(storedHeight) : null;
        let topNb = storedTop ? parseFloat(storedTop) : null;
        let leftNb = storedLeft ? parseFloat(storedLeft) : null;
        if (widthNb != null && element.getAttribute('resize')) {
            elementDiv.style.width = Utils.getVh(widthNb);
        }
        else {
            elementDiv.style.width = Utils.getVh(parseInt(element.getAttribute('min-width')));
        }
        if (element.getAttribute('resize') && element.getAttribute('resize') !== 'x') {
            if (storedHeight) {
                elementDiv.style.height = Utils.getVh(heightNb);
            }
            else {
                elementDiv.style.height = Utils.getVh(parseInt(element.getAttribute('min-height')));
            }
        }
        let currentHeight = elementDiv.getBoundingClientRect().height * 100 / Utils.getVirtualHeight();
        if (topNb != null) {
            if (topNb < 0) {
                elementDiv.style.top = '0';
                elementDiv.style.bottom = 'auto';
            }
            else if (topNb + currentHeight >= 90) {
                elementDiv.style.top = 'auto';
                let bottom = Math.max(0, 100 - (currentHeight + topNb));
                elementDiv.style.bottom = Utils.getVh(bottom);
            }
            else {
                elementDiv.style.top = Utils.getVh(topNb);
                elementDiv.style.bottom = 'auto';
            }
        }
        if (storedLeft != null && leftNb != null) {
            if (leftNb < 0) {
                elementDiv.style.left = '0';
                elementDiv.style.right = 'auto';
            }
            else if ((leftNb + widthNb / 2) / Utils.getScreenRatio() >= 50) {
                elementDiv.style.left = 'auto';
                let right = Math.max(0, (100 * Utils.getScreenRatio() - (leftNb + widthNb)));
                elementDiv.style.right = Utils.getVh(right);
            }
            else {
                elementDiv.style.left = Utils.getVh(leftNb);
                elementDiv.style.right = 'auto';
            }
        }
        if (topNb == null && leftNb == null) {
            let style = getComputedStyle(element);
            let defaultLeft = style.getPropertyValue('--defaultLeft');
            let defaultTop = style.getPropertyValue('--defaultTop');
            let defaultRight = style.getPropertyValue('--defaultRight');
            let defaultBottom = style.getPropertyValue('--defaultBottom');
            let defaultWidth = style.getPropertyValue('--defaultWidth');
            let defaultHeight = style.getPropertyValue('--defaultHeight');
            if (defaultLeft.length > 0) {
                element.style.left = defaultLeft;
                element.style.right = "auto";
            }
            else if (defaultRight.length > 0) {
                element.style.right = defaultRight;
                element.style.left = "auto";
            }
            if (defaultTop.length > 0) {
                element.style.top = defaultTop;
                element.style.bottom = "auto";
            }
            else if (defaultBottom.length > 0) {
                element.style.bottom = defaultBottom;
                element.style.top = "auto";
            }
            if (defaultWidth.length > 0) {
                element.style.width = defaultWidth;
            }
            if (defaultHeight.length > 0) {
                element.style.height = defaultHeight;
            }
        }
    }
}
window.document.addEventListener("keydown", function (e) {
    if (e.keyCode == KeyCode.KEY_TAB) {
        e.preventDefault();
    }
    if (e.keyCode == KeyCode.KEY_BACK_SPACE || e.keyCode == KeyCode.KEY_SPACE) {
        var target = (e.target);
        if (target != null) {
            if (target.tagName.toUpperCase() != "INPUT" && target.tagName.toUpperCase() != "TEXTAREA" && !target.classList.contains('likeform'))
                e.preventDefault();
        }
    }
});
function OnInputFieldFocus(e) {
    let input = e.currentTarget;
    UINavigation.lockFocus = true;
    UINavigation.askGrabKeys();
    input["inputFocusEventHandler"] = Coherent.on("mousePressOutsideView", () => {
        input.blur();
        OnInputFieldUnfocus(e);
    });
    if (!input.hasAttribute("custom-inputbar"))
        Coherent.trigger("FOCUS_INPUT_FIELD", input.id, input.value);
}
function OnInputFieldUnfocus(e) {
    let input = e.target;
    if (input["inputFocusEventHandler"]) {
        UINavigation.lockFocus = false;
        input["inputFocusEventHandler"].clear();
        if (!input.hasAttribute("custom-inputbar"))
            Coherent.trigger("UNFOCUS_INPUT_FIELD", input.id);
        input["inputFocusEventHandler"] = null;
    }
}
function LogCallstack(message) {
    var error = new Error(message);
    console.warn(error);
}
var bDebugLoading = false;
class SmartLoader {
    constructor() {
        this.onDocumentLoaded = () => {
            var links = window.document.querySelectorAll('link[rel="import"]');
            for (var i = 0; i < links.length; i++) {
                if (bDebugLoading)
                    console.warn("links[i].href : " + links[i].href);
                var fileName = this.convertPath(links[i].href);
                if (!this._resourcesLoaded.find(function (val) { return val == fileName.toUpperCase(); })) {
                    this._resourcesToLoad.push(fileName.toUpperCase());
                    if (bDebugLoading)
                        console.warn("add event listener " + fileName);
                }
            }
            if (bDebugLoading)
                console.warn("Check loaded from document loaded");
            this.checkLoaded();
        };
        this.m_timeoutCheckLoaded = -1;
        this.onResourceLoaded = (e) => {
            if (bDebugLoading)
                console.warn("onResourceLoaded : " + e.detail);
            var pathSimple = this.convertPath(e.detail);
            this._resourcesLoaded.push(pathSimple);
            if (bDebugLoading)
                console.warn("onResourceLoaded : " + pathSimple + " /// " + this._htmlPath);
            let mustCheck = false;
            for (var i = this._resourcesToLoad.length - 1; i >= 0; i--) {
                if (this._resourcesToLoad[i] == pathSimple) {
                    this._resourcesToLoad.splice(i, 1);
                    if (bDebugLoading)
                        console.warn("resource found : " + pathSimple);
                    mustCheck = true;
                }
            }
            if (this._resourcesToLoad.length == 0) {
                Include.onAllResourcesLoaded();
            }
            if (mustCheck) {
                if (this.m_timeoutCheckLoaded >= 0)
                    clearTimeout(this.m_timeoutCheckLoaded);
                this.m_timeoutCheckLoaded = setTimeout(this.checkLoaded, 100);
                this.checkLoaded();
            }
        };
        this.m_OnViewLoadedSend = false;
        this.checkLoaded = () => {
            if (bDebugLoading) {
                console.warn("Check loaded : " + this._resourcesToLoad.length + " for " + this._htmlPath);
                console.warn(this._resourcesToLoad);
            }
            if (this._resourcesToLoad.length == 0) {
                if (this.m_OnViewLoadedSend) {
                    if (bDebugLoading)
                        console.error("ON_VIEW_LOADED send twice !");
                    return;
                }
                this.m_OnViewLoadedSend = true;
                if (bDebugLoading) {
                    console.warn("ON_VIEW_LOADED Send for " + this._htmlPath);
                }
                Coherent["isViewLoaded"] = true;
                Coherent.trigger("ON_VIEW_LOADED", 'html_ui' + this._htmlPath);
                CoherentSetup.CheckCoherentEngine(window);
                if (window && window.document && window.document.body) {
                    window.document.body.classList.remove("contentLoading");
                    window.document.body.classList.add("contentLoaded");
                }
            }
        };
        this.OnNodeRemoved = (e) => {
        };
        this._resourcesToLoad = new Array();
        this._resourcesLoaded = [];
        var currentLocation = window.location;
        var url = currentLocation.pathname;
        this._htmlPath = url;
        window.document.addEventListener("DOMContentLoaded", this.onDocumentLoaded);
        window.document.addEventListener("ResourceLoaded", this.onResourceLoaded);
        if (bDebugLoading)
            console.warn("CONSTRUCTOR " + this._htmlPath);
    }
    convertPath(path) {
        return path.split("/").pop().replace(".html", "").replace(".js", "").toUpperCase();
    }
    addResource(path) {
        if (bDebugLoading)
            console.warn("addResource : ", path);
        this._resourcesToLoad.push(this.convertPath(path));
    }
    onInputRemoved(input) {
        if (document.activeElement == input)
            input.blur();
        if (input["inputFocusEventHandler"])
            input["inputFocusEventHandler"].clear();
        input.removeEventListener("focus", OnInputFieldFocus);
        input.removeEventListener("blur", OnInputFieldUnfocus);
    }
}
var loader = new SmartLoader();
class DebugMgr {
    constructor() {
        this.m_defaultPosRight = 0;
        this.m_defaultPosTop = 0;
        this.CreateDebugPanel = () => {
            if (this.m_debugPanel != null)
                return;
            if (!document.body) {
                Coherent.on("ON_VIEW_LOADED", this.CreateDebugPanel);
                return;
            }
            this.m_debugPanel = document.createElement("div");
            this.m_debugPanel.id = "DebugPanel";
            this.m_debugPanel.classList.add("debugPanel");
            document.body.appendChild(this.m_debugPanel);
            this.setDefaultPos(this.m_defaultPosRight, this.m_defaultPosTop);
            this.dragDropHandler = new DragDropHandler(this.m_debugPanel);
            document.dispatchEvent(new Event("DebugPanelCreated"));
        };
        this.m_defaultLog = null;
        this.m_defaultWarn = null;
        this.m_defaultError = null;
    }
    setDefaultPos(right, top) {
        this.m_defaultPosRight = right;
        this.m_defaultPosTop = top;
        if (this.m_debugPanel) {
            this.m_debugPanel.style.top = this.m_defaultPosTop + "%";
            this.m_debugPanel.style.right = this.m_defaultPosRight + "%";
        }
    }
    AddDebugButton(text, callback, autoStart = false) {
        let bMushShow = EDITION_MODE() || !Coherent.isAttached;
        if (!bMushShow)
            return;
        if (this.m_debugPanel == null) {
            document.addEventListener("DebugPanelCreated", this.AddDebugButton.bind(this, text, callback, autoStart));
            this.CreateDebugPanel();
            return;
        }
        var button = document.createElement("div");
        button.innerText = text;
        button.classList.add("debugButton");
        button.addEventListener("click", callback);
        button.setAttribute("data-input-group", "DebugButton");
        if (this.m_ConsoleCallback) {
            button.addEventListener("click", this.UpdateConsole.bind(this));
        }
        this.m_debugPanel.appendChild(button);
        if (autoStart) {
            requestAnimationFrame(callback);
            this.UpdateConsole();
        }
        document.body.classList.add("EditionMode");
    }
    UpdateConsole() {
        if (this.m_ConsoleCallback) {
            this.m_consoleElem.innerHTML = this.m_ConsoleCallback();
        }
    }
    AddConsole(callback, force = false) {
        let bMushShow = EDITION_MODE() || !Coherent.isAttached || force;
        if (!bMushShow)
            return;
        if (this.m_debugPanel == null) {
            document.addEventListener("DebugPanelCreated", this.AddConsole.bind(this, callback));
            this.CreateDebugPanel();
            return;
        }
        this.m_consoleElem = document.createElement("div");
        this.m_consoleElem.classList.add("Console");
        this.m_consoleElem.classList.add("scrollbar");
        this.m_debugPanel.appendChild(this.m_consoleElem);
        this.m_ConsoleCallback = callback;
        if (!this.m_defaultLog)
            this.m_defaultLog = console.log;
        if (!this.m_defaultWarn)
            this.m_defaultWarn = console.warn;
        if (!this.m_defaultError)
            this.m_defaultError = console.error;
        //console.log = this.log.bind(this);
        //console.warn = this.warn.bind(this);
        //console.error = this.error.bind(this);
    }
    log() {
        this.m_defaultLog.apply(console, arguments);
        this.logConsole("log", ...arguments);
    }
    warn() {
        this.m_defaultWarn.apply(console, arguments);
        this.logConsole("warn", ...arguments);
    }
    error() {
        this.m_defaultError.apply(console, arguments);
        this.logConsole("error", ...arguments);
    }
    logConsole(style, ...rest) {
        var Args = Array.prototype.slice.call(arguments);
        for (var i = 1; i < Args.length; i++) {
            var node = document.createElement("div");
            node.innerText = (Args[i]);
            node.classList.add(style);
            this.m_consoleElem.appendChild(node);
            node.scrollIntoView();
        }
    }
}
var g_debugMgr = new DebugMgr;
var MouseCursor;
(function (MouseCursor) {
    MouseCursor[MouseCursor["DRAG"] = 0] = "DRAG";
    MouseCursor[MouseCursor["RESIZE_H"] = 1] = "RESIZE_H";
    MouseCursor[MouseCursor["RESIZE_V"] = 2] = "RESIZE_V";
    MouseCursor[MouseCursor["RESIZE_HV"] = 3] = "RESIZE_HV";
})(MouseCursor || (MouseCursor = {}));
var Cursor;
(function (Cursor) {
    function setCursor(_Cursor) {
        Coherent.trigger("SET_MOUSE_CURSOR", MouseCursor[_Cursor]);
    }
    Cursor.setCursor = setCursor;
    function unsetCursor() {
        Coherent.trigger("SET_MOUSE_CURSOR", "");
    }
    Cursor.unsetCursor = unsetCursor;
})(Cursor || (Cursor = {}));
class DataValue {
    constructor(data) {
        if (data) {
            Object.assign(this, data);
        }
    }
    static set(name = "", value, unit, valueStr = null, icon = "") {
        let ret = new DataValue();
        ret.name = name;
        if (value != undefined) { }
        ret.value = value;
        ret.valueStr = valueStr;
        if (!valueStr && value != null) {
            ret.valueStr = value.toFixed(0);
        }
        ret.unit = unit;
        ret.html = "<span class='value'>" + ret.valueStr + "</span><span class='unit'>" + ret.unit + "</span>";
        ret.icon = icon;
        return ret;
    }
    static compare(arg0, arg1) {
        if (arg0.ID !== arg1.ID) {
            return false;
        }
        ;
        if (arg0.icon !== arg1.icon) {
            return false;
        }
        ;
        if (arg0.name !== arg1.name) {
            return false;
        }
        ;
        if (arg0.valueStr !== arg1.valueStr) {
            return false;
        }
        ;
        if (arg0.value !== arg1.value) {
            return false;
        }
        ;
        if (arg0.unit !== arg1.unit) {
            return false;
        }
        ;
        if (arg0.quality !== arg1.quality) {
            return false;
        }
        ;
        if (arg0.type !== arg1.type) {
            return false;
        }
        ;
        if (arg0.html != arg1.html) {
            return false;
        }
        ;
        return true;
    }
}
class TreeDataValue extends DataValue {
    static compare(arg0, arg1) {
        if (DataValue.compare(arg0, arg1)) {
            let me = arg0;
            let other = arg1;
            if (me.children && other.children) {
                if (me.children.length != other.children.length) {
                    return false;
                }
                for (let i = 0; i < me.children.length; i++) {
                    if (TreeDataValue.compare(me.children[i], other.children[i]) == false)
                        return false;
                }
                return true;
            }
            else {
                if (me.children || other.children)
                    return false;
                else
                    return true;
            }
        }
        else {
            return false;
        }
    }
}
class RangeDataValue extends DataValue {
}
class DataTable {
}
class TableDataValue {
}
class Vec2 {
    constructor(_x = 0, _y = 0) {
        this.x = _x;
        this.y = _y;
    }
    static FromRect(rect) {
        var ret = new Vec2();
        ret.x = rect.left + rect.width * 0.5;
        ret.y = rect.top + rect.height * 0.5;
        return ret;
    }
    static Delta(vec1, vec2) {
        var ret = new Vec2();
        ret.x = vec1.x - vec2.x;
        ret.y = vec1.y - vec2.y;
        return ret;
    }
    Set(x, y) {
        this.x = x;
        this.y = y;
    }
    VectorTo(other) {
        if (other)
            return Vec2.Delta(other, this);
        else
            return new Vec2();
    }
    Add(x, y, z) {
        var ret = new Vec2();
        ret.x = this.x + x;
        ret.y = this.y + y;
        return ret;
    }
    Substract(x, y, z) {
        var ret = new Vec2();
        ret.x = this.x - x;
        ret.y = this.y - y;
        return ret;
    }
    AddVec(other) {
        if (other) {
            var ret = new Vec2();
            ret.x = this.x + other.x;
            ret.y = this.y + other.y;
            return ret;
        }
        else
            return new Vec2(this.x, this.y);
    }
    SubstractVec(other) {
        if (other) {
            var ret = new Vec2();
            ret.x = this.x - other.x;
            ret.y = this.y - other.y;
            return ret;
        }
        else
            return new Vec2(this.x, this.y);
    }
    toCurvePointString() {
        return `${this.x} ${this.y}`;
    }
    Dot(other) {
        return this.x * other.x + this.y * other.y;
    }
    GetNorm() {
        return Math.sqrt(this.Dot(this));
    }
    Normalize() {
        var norm = this.GetNorm();
        if (norm > 0) {
            this.x /= norm;
            this.y /= norm;
        }
    }
    SetNorm(n) {
        var norm = this.GetNorm();
        if (norm > 0) {
            var factor = n / norm;
            this.x *= factor;
            this.y *= factor;
        }
    }
    SqrDistance(other) {
        return (this.x - other.x) * (this.x - other.x) + (this.y - other.y) * (this.y - other.y);
    }
    RectSqrDistance(rect) {
        let rectCenter = Vec2.FromRect(rect);
        let dx = Math.max(Math.abs(this.x - rectCenter.x) - rect.width * 0.5, 0);
        let dy = Math.max(Math.abs(this.y - rectCenter.y) - rect.height * 0.5, 0);
        return dx * dx + dy * dy;
    }
    Distance(other) {
        return Math.sqrt(this.SqrDistance(other));
    }
    IsInside(rect) {
        return this.x > rect.left && this.x < rect.right && this.y > rect.top && this.y < rect.bottom;
    }
    Equals(other) {
        return (this.SqrDistance(other) < Number.EPSILON) ? true : false;
    }
}
class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    toString() {
        return this.x + " " + this.y + " " + this.z;
    }
    static Delta(vec1, vec2) {
        var ret = new Vec3();
        ret.x = vec1.x - vec2.x;
        ret.y = vec1.y - vec2.y;
        ret.z = vec1.z - vec2.z;
        return ret;
    }
    Set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    VectorTo(other) {
        if (other)
            return Vec3.Delta(other, this);
        else
            return new Vec3();
    }
    Add(x, y, z) {
        var ret = new Vec3();
        ret.x = this.x + x;
        ret.y = this.y + y;
        ret.z = this.z + z;
        return ret;
    }
    Substract(x, y, z) {
        var ret = new Vec3();
        ret.x = this.x - x;
        ret.y = this.y - y;
        ret.z = this.z - z;
        return ret;
    }
    AddVec(other) {
        if (other) {
            var ret = new Vec3();
            ret.x = this.x + other.x;
            ret.y = this.y + other.y;
            ret.z = this.z + other.z;
            return ret;
        }
        else
            return new Vec3(this.x, this.y, this.z);
    }
    SubstractVec(other) {
        if (other) {
            var ret = new Vec3();
            ret.x = this.x - other.x;
            ret.y = this.y - other.y;
            ret.z = this.z - other.z;
            return ret;
        }
        else
            return new Vec3(this.x, this.y, this.z);
    }
    toCurvePointString() {
        return `${this.x} ${this.y} ${this.z}`;
    }
    Dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    GetNorm() {
        return Math.sqrt(this.Dot(this));
    }
    Normalize() {
        var norm = this.GetNorm();
        if (norm > 0) {
            this.x /= norm;
            this.y /= norm;
            this.z /= norm;
        }
    }
    SetNorm(n) {
        var norm = this.GetNorm();
        if (norm > 0) {
            var factor = n / norm;
            this.x *= factor;
            this.y *= factor;
            this.z *= factor;
        }
    }
    SqrDistance(other) {
        return (this.x - other.x) * (this.x - other.x) + (this.y - other.y) * (this.y - other.y) + (this.z - other.z) * (this.z - other.z);
    }
    Distance(other) {
        return Math.sqrt(this.SqrDistance(other));
    }
    Equals(other) {
        return (this.SqrDistance(other) < Number.EPSILON) ? true : false;
    }
}
class IconTextElement extends UIElement {
    constructor() {
        super();
    }
    get basePath() { return "coui://html_ui/icons/"; }
    get subPath() { return this.getAttribute("data-subpath"); }
    get imageName() { return this.getAttribute("data-imagename"); }
    get altText() { return this.getAttribute("data-alttext"); }
    get observedAttributes() {
        return [];
    }
    connectedCallback() {
        super.connectedCallback();
        this.updateIcon();
    }
    updateIcon() {
        Utils.RemoveAllChildren(this);
        var subPath = this.subPath;
        var imageNames = this.imageName ? this.imageName.split('|') : [];
        var altTexts = this.altText ? this.altText.split('|') : [];
        this.classList.add(IconTextElement.CLASS_NAME);
        this.classList.remove('has-icon');
        if (imageNames.length > 0) {
            for (let i = 0; i < imageNames.length; i++) {
                let imageName = imageNames[i];
                var imgSrc = encodeURI(this.basePath + subPath + "/" + imageName);
                if (imageName.endsWith('.svg')) {
                    let iconContainer = document.createElement('div');
                    iconContainer.classList.add('text-icon-container');
                    let icon = document.createElement("icon-element");
                    var elem = this;
                    icon.onerror = (e) => {
                        icon.style.display = "none";
                        elem.displayAltText(iconContainer, altTexts[i]);
                    };
                    icon.addEventListener('iconElementLoaded', () => {
                        this.classList.add('has-icon');
                    }, { once: true });
                    icon.setAttribute('data-url', imgSrc);
                    iconContainer.appendChild(icon);
                    this.appendChild(iconContainer);
                    setTimeout(() => {
                        let svgElem = icon.querySelector('svg');
                        if (svgElem)
                            svgElem.setAttribute('height', '100%');
                    }, 0);
                }
                else {
                    var imgSrc = encodeURI(this.basePath + subPath + "/" + imageName);
                    var img = document.createElement("img");
                    console.warn("imgSrc", imgSrc);
                    img.src = imgSrc;
                    this.appendChild(img);
                    var elem = this;
                    img.onerror = (e) => {
                        img.style.display = "none";
                        elem.displayAltText(img, altTexts[i]);
                    };
                }
                if (i < imageNames.length - 1) {
                    let separator = document.createElement('div');
                    separator.classList.add('separator');
                    separator.innerHTML = "+";
                    this.appendChild(separator);
                }
            }
        }
        else {
            for (let i = 0; i < altTexts.length; i++) {
                this.displayAltText(null, altTexts[i]);
                if (i < altTexts.length - 1) {
                    let separator = document.createElement('div');
                    separator.classList.add('separator');
                    separator.innerHTML = "+";
                    this.appendChild(separator);
                }
            }
        }
    }
    displayAltText(icon, altText) {
        if (icon) {
            if (icon.classList.contains('text-icon-container')) {
                Utils.RemoveAllChildren(icon);
            }
            else if (icon.parentElement) {
                icon.parentElement.removeChild(icon);
            }
        }
        else {
            icon = document.createElement('div');
            icon.classList.add('text-icon-container');
            this.appendChild(icon);
        }
        let iconContainer = icon;
        iconContainer.classList.add('no-image-found');
        let text = document.createElement('div');
        text.classList.add('text');
        text.textContent = altText;
        iconContainer.appendChild(text);
    }
}
IconTextElement.CLASS_NAME = 'IconTextElement';
window.customElements.define("icon-text", IconTextElement);
class DeviceButtonElement extends IconTextElement {
    constructor() {
        super();
    }
    get basePath() { return "coui://html_UI/Textures/Menu/Control/"; }
    get subPath() { return this.getAttribute("data-device"); }
    get imageName() {
        if (this.hasAttribute("data-button") && this.getAttribute("data-button").length > 0) {
            let buttons = this.getAttribute("data-button").split('|');
            return buttons.map(button => button + ".svg").join('|');
        }
        else
            return "";
    }
    get altText() { return this.getAttribute("data-buttondesc"); }
    get observedAttributes() {
        return super.observedAttributes.concat(["data-device", "data-button", "data-buttondesc"]);
    }
    setData(subPath, imageName, altText) {
        let hasDiff = subPath != this.subPath || imageName != this.imageName || altText != this.altText;
        this.setAttribute('data-device', subPath);
        this.setAttribute('data-button', imageName);
        this.setAttribute('data-buttonDesc', altText);
        if (hasDiff) {
            this.updateIcon();
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                default:
                    break;
            }
        }
    }
}
window.customElements.define("device-button", DeviceButtonElement);
class AtlasItemInfos {
    constructor() {
        this.needToSendRegisteredRectOnly = false;
    }
}
class AltasElementsMgr {
    constructor() {
        this.m_elements = [];
        this.RebuildAtlasElements = () => {
            if (!closed) {
                Coherent.trigger("CLEAR_ALL_ATLAS_ELEMENTS");
                for (let item of this.m_elements) {
                    item.rect = new DOMRect();
                    item.needToSendRegisteredRectOnly = false;
                }
                var allElementsWithID = document.querySelectorAll("[data-atlas-element]");
                for (var elem of allElementsWithID) {
                    if (!elem.classList.contains("hide")) {
                        this.AddAtlasElement(elem);
                    }
                }
            }
        };
        Coherent.on("GetAllAtlasElements", this.RebuildAtlasElements);
        window.top.addEventListener('resize', this.RebuildAtlasElements);
    }
    SendItem(registeredElem) {
        if (!registeredElem)
            return;
        if (registeredElem.needToSendRegisteredRectOnly) {
            if (Coherent) {
                Coherent.trigger("SET_ATLAS_ELEMENT", registeredElem.elem.id, registeredElem.rect.left, registeredElem.rect.top, registeredElem.rect.right, registeredElem.rect.bottom);
            }
            registeredElem.needToSendRegisteredRectOnly = false;
            return;
        }
        const rect = registeredElem.elem.getBoundingClientRect();
        if (rect.width == 0 || rect.height == 0) {
            requestAnimationFrame(this.SendItem.bind(this, registeredElem));
            return;
        }
        if (rect.width != registeredElem.rect.width || rect.height != registeredElem.rect.height) {
            registeredElem.rect = rect;
            if (Coherent) {
                Coherent.trigger("SET_ATLAS_ELEMENT", registeredElem.elem.id, rect.left, rect.top, rect.right, rect.bottom);
            }
        }
    }
    RemoveAtlasElement(elem) {
        let index = this.m_elements.findIndex(function (val) { return val.elem == elem; });
        if (index >= 0) {
            this.m_elements.splice(index, 1);
        }
        Coherent.trigger("REMOVE_ATLAS_ELEMENT", elem.id);
    }
    AddAtlasElement(elem) {
        if (elem.id == "")
            return;
        let registeredElem = this.m_elements.find(function (val) { return val.elem == elem; });
        if (!registeredElem) {
            registeredElem = new AtlasItemInfos();
            registeredElem.elem = elem;
            registeredElem.rect = new DOMRect();
            this.m_elements.push(registeredElem);
        }
        this.SendItem(registeredElem);
    }
    InvalidateAtlasElement(elem) {
        let index = this.m_elements.findIndex(function (val) { return val.elem == elem; });
        if (index >= 0)
            this.m_elements.splice(index);
    }
    RequestSendRegirsteredRectOnNextAdd(elem) {
        const regElem = this.m_elements.find(function (val) { return val.elem == elem; });
        if (regElem)
            regElem.needToSendRegisteredRectOnly = true;
        else
            this.AddAtlasElement(elem);
    }
}
var g_AtlasMgr = new AltasElementsMgr();
var InputBar;
(function (InputBar) {
    InputBar.MENU_BUTTON_A = "MENU_VALID";
    InputBar.MENU_BUTTON_B = "MENU_BACK";
    InputBar.MENU_BUTTON_X = "MENU_VALI2";
    InputBar.MENU_BUTTON_Y = "MENU_CANCEL";
    InputBar.MENU_BUTTON_START = "MENU_START";
    InputBar.MENU_BUTTON_SELECT = "MENU_SELECT";
    InputBar.MENU_BUTTON_OPEN = "MENU_OPEN";
    InputBar.MENU_BUTTON_RESET = "MENU_RESET";
    InputBar.MENU_BUTTON_APPLY = "MENU_APPLY";
    InputBar.MENU_BUTTON_PRESET_MANAGER = "MENU_PRESET_MANAGER";
    InputBar.MENU_BUTTON_PROFILE_MANAGER = "MENU_PROFILE_MANAGER";
    InputBar.MENU_BUTTON_CONTENT_MANAGER = "MENU_CONTENT_MANAGER";
    InputBar.MENU_BUTTON_QUIT = "MENU_QUIT_GAME";
    InputBar.MENU_BUTTON_CLOSE = "MENU_CLOSE";
    InputBar.MENU_BUTTON_BACK = "MENU_BACK";
    InputBar.MENU_BUTTON_WM_FILTERS = "MENU_WM_FILTERS";
    InputBar.MENU_BUTTON_WM_LEGEND = "MENU_WM_LEGEND";
    InputBar.MENU_BUTTON_CUSTOMIZE = "MENU_CUSTOMIZE";
    InputBar.MENU_BUTTON_FLY = "MENU_FLY";
    InputBar.MENU_BUTTON_FAVORITE = "MENU_BUTTON_FAVORITE";
    InputBar.MENU_BUTTON_TAB_LEFT = "MENU_L1";
    InputBar.MENU_BUTTON_TAB_RIGHT = "MENU_R1";
    InputBar.MENU_BUTTON_RANALOG_X = "KEY_MENU_SCROLL_AXIS_X";
    InputBar.MENU_BUTTON_RANALOG_Y = "KEY_MENU_SCROLL_AXIS_Y";
    InputBar.MENU_BUTTON_RANALOG_XY = "MENU_WM_LEGEND";
    function isContainer(elem) {
        return (elem).getButtons !== undefined;
    }
    InputBar.isContainer = isContainer;
    class InputBarButtonParams {
        constructor(id, _text, _inputActionName, _event, _inputActionContext = "MENU", _alsoToGlobalFlow = false, _disabled = false) {
            this.__Type = "InputBarButtonParams";
            this.inputContextName = "MENU";
            this.enabled = true;
            this.alsoToGlobalFlow = false;
            this.id = id;
            this.text = Coherent.translate(_text);
            this.inputActionName = _inputActionName;
            this.eventToView = _event;
            this.inputContextName = _inputActionContext;
            this.alsoToGlobalFlow = _alsoToGlobalFlow;
            this.enabled = _disabled === false;
        }
        release() {
            if (this.m_coherentHandle)
                this.m_coherentHandle.clear();
        }
        static setCallback(id, _text, _inputActionName, callback, _inputActionContext = "MENU", _alsoToGlobalFlow = false, _disabled = false) {
            let eventName = id + Utils.generateGUID();
            let ret = new InputBarButtonParams(id, _text, _inputActionName, eventName, _inputActionContext, _alsoToGlobalFlow, _disabled);
            ret.m_coherentHandle = Coherent.on(eventName, callback);
            return ret;
        }
    }
    InputBar.InputBarButtonParams = InputBarButtonParams;
    class InputBarParams {
        constructor() {
            this.__Type = "InputBarParams";
            this.buttons = [];
        }
        release() {
            if (this.buttons) {
                for (let button of this.buttons) {
                    button.release();
                }
                this.buttons = [];
            }
        }
    }
    InputBar.InputBarParams = InputBarParams;
    var m_InputBarListener = null;
    var m_Registered = [];
    function setInputBar(id, params) {
        m_Registered.push(id);
        if (m_InputBarListener && m_InputBarListener.connected) {
            Coherent.trigger("REGISTER_INPUT_BAR", id, window.location.pathname);
            Coherent.trigger("SET_INPUT_BAR", id, params.buttons, window.location.pathname);
        }
        else {
            m_InputBarListener = RegisterViewListener("JS_LISTENER_INPUTBAR", function () {
                Coherent.trigger("REGISTER_INPUT_BAR", id, window.location.pathname);
                Coherent.trigger("SET_INPUT_BAR", id, params.buttons, window.location.pathname);
            }, true);
        }
        Coherent.on("StartHideView", clearInputBar.bind(null, id));
    }
    InputBar.setInputBar = setInputBar;
    function addInputBar(id, parentId, params) {
        m_Registered.push(id);
        if (m_InputBarListener && m_InputBarListener.connected) {
            Coherent.trigger("REGISTER_INPUT_BAR", id, window.location.pathname);
            Coherent.trigger("ADD_INPUT_BAR", id, parentId, params.buttons, window.location.pathname);
        }
        else {
            m_InputBarListener = RegisterViewListener("JS_LISTENER_INPUTBAR", function () {
                Coherent.trigger("REGISTER_INPUT_BAR", id, window.location.pathname);
                Coherent.trigger("ADD_INPUT_BAR", id, parentId, params.buttons, window.location.pathname);
            }, true);
        }
        Coherent.on("StartHideView", clearInputBar.bind(null, id));
    }
    InputBar.addInputBar = addInputBar;
    function clearInputBar(id) {
        if (!window)
            return;
        Coherent.trigger("REMOVE_INPUT_BAR", id, window.location.pathname);
        if (m_InputBarListener) {
            let idx = m_Registered.findIndex((value) => { return value === id; });
            if (idx >= 0)
                m_Registered.splice(idx, 1);
            if (m_Registered.length == 0) {
                m_InputBarListener.unregister();
                m_InputBarListener = null;
            }
        }
    }
    InputBar.clearInputBar = clearInputBar;
})(InputBar || (InputBar = {}));
class NotificationButton {
    constructor(_title = "", _event = "", _close = true, _theme = null, _toGlobalFlow = false) {
        this.__Type = "NotificationButton";
        this.toGlobalFlow = false;
        this.close = true;
        this.enabled = true;
        this.title = _title;
        this.event = _event;
        this.close = _close;
        this.theme = _theme || "";
        this.toGlobalFlow = _toGlobalFlow;
    }
}
function isWindowEnabled() {
    return window.top["window_enabled"];
}
function setWindowEnabled(val) {
    window.top["window_enabled"] = val;
}
if (window.top == window)
    setWindowEnabled(true);
Coherent.on("DialogIsEnabled", (enabled) => {
    setWindowEnabled(enabled);
    window.dispatchEvent(new Event('windowEnabledChange'));
});
var PopUp;
(function (PopUp) {
    let g_popUplistener;
    var bGreyedNotif = false;
    var bGreyedPopup = false;
    var bBlurredMenu = false;
    var bWidgetContentPopup = false;
    function isBlockedByPopUp() {
        return window.top["blockedByPopUp"];
    }
    PopUp.isBlockedByPopUp = isBlockedByPopUp;
    function setBlockedByPopUp(val) {
        return window.top["blockedByPopUp"] = val;
        ;
    }
    Coherent.on("PopUpDisplayed", OnPopUpDisplayed);
    Coherent.on("PopUpHidden", OnPopUpHidden);
    Coherent.on("MenuPopUpDisplayed", OnMenuPopUpDisplayed);
    Coherent.on("MenuPopUpHidden", OnMenuPopUpHidden);
    Coherent.on("SwitchVRModeState", OnSwitchVRModeState);
    function OnPopUpDisplayed(type) {
        if (!Utils.inIframe()) {
            setBlockedByPopUp(true);
            if (type == "MODAL_POPUP") {
                bGreyedNotif = true;
                if (!g_externalVariables.vrMode) {
                    window.document.body.classList.add("greyed-notif");
                }
            }
            else if (type == "COMMUNITY_PANEL") {
                bGreyedPopup = true;
                if (!g_externalVariables.vrMode) {
                    if (isWindowEnabled()) {
                        window.document.body.classList.add("greyed-popup");
                    }
                    else {
                        window.document.body.classList.add("disable-greyed");
                    }
                }
            }
            else if (type == "WIDGETCONTENT_POPUP") {
                bWidgetContentPopup = true;
                if (!g_externalVariables.vrMode) {
                    window.document.body.classList.add("widget-content-popup");
                }
            }
        }
    }
    function OnPopUpHidden(type) {
        setBlockedByPopUp(false);
        if (!window.document.body)
            return;
        if (type == "MODAL_POPUP") {
            bGreyedNotif = false;
            window.document.body.classList.remove("greyed-notif");
        }
        else if (type == "WIDGETCONTENT_POPUP") {
            bWidgetContentPopup = false;
            window.document.body.classList.remove("widget-content-popup");
        }
        else if (type == "COMMUNITY_PANEL") {
            bGreyedPopup = false;
            window.document.body.classList.remove("greyed-popup");
            window.document.body.classList.remove("disable-greyed");
        }
        else if (type == "") {
            bGreyedPopup = false;
            window.document.body.classList.remove("greyed-popup");
            window.document.body.classList.remove("disable-greyed");
            bGreyedNotif = false;
            window.document.body.classList.remove("greyed-notif");
        }
    }
    function OnMenuPopUpDisplayed() {
        bBlurredMenu = true;
        if (!g_externalVariables.vrMode) {
            setBlockedByPopUp(true);
            window.document.body.classList.add("blurMenu");
        }
    }
    function OnMenuPopUpHidden() {
        bBlurredMenu = false;
        setBlockedByPopUp(false);
        window.document.body.classList.remove("blurMenu");
    }
    function OnSwitchVRModeState(state) {
        if (bGreyedNotif) {
            if (state) {
                window.document.body.classList.remove("greyed-notif");
            }
            else {
                window.document.body.classList.add("greyed-notif");
            }
        }
        if (bGreyedPopup) {
            if (state) {
                window.document.body.classList.remove("greyed-popup");
                window.document.body.classList.remove("disable-greyed");
            }
            else if (isWindowEnabled()) {
                window.document.body.classList.add("greyed-popup");
            }
            else {
                window.document.body.classList.add("disable-greyed");
            }
        }
        if (bBlurredMenu) {
            if (state) {
                window.document.body.classList.remove("blurMenu");
            }
            else {
                window.document.body.classList.add("blurMenu");
            }
        }
    }
    class PopUpParams {
        constructor() {
            this.__Type = "PopUpParams";
            this.buttons = [];
            this.style = "normal";
            this.displayGlobalPopup = true;
        }
    }
    PopUp.PopUpParams = PopUpParams;
    function _showPopUp(params) {
        console.warn("SHOW POP UP", params);
        Coherent.trigger("SHOW_POP_UP", params);
    }
    function showPopUp(params) {
        if (params.displayGlobalPopup) {
            if (!g_popUplistener) {
                g_popUplistener = RegisterViewListener("JS_LISTENER_POPUP", _showPopUp.bind(null, params));
            }
            else {
                _showPopUp(params);
            }
        }
        else {
            window.dispatchEvent(new CustomEvent("showPopUpInPage", { detail: { params: params } }));
        }
    }
    PopUp.showPopUp = showPopUp;
})(PopUp || (PopUp = {}));
class ComponentRegister {
    constructor() {
        this.imported = false;
    }
    addImport() {
        if (!this.imported) {
            this.imported = true;
            Include.addImport(this.import);
        }
    }
}
class ComponentMgr {
    constructor() {
        this.m_registered = {};
        document.addEventListener("DOMNodeInserted", this.onNodeInserted.bind(this));
        document.addEventListener("DOMContentLoaded", this.checkAllComponents.bind(this));
    }
    onNodeInserted(event) {
        let node = event.target;
        let nodeType = node.nodeName;
        if (node.hasAttribute && node.hasAttribute("import-template")) {
            Include.addImport(node.getAttribute("import-template"));
        }
        if (node.hasAttribute && node.hasAttribute("import-script")) {
            let callback = null;
            if (node.hasAttribute("import-after")) {
                callback = () => {
                    Include.addImports(node.getAttribute("import-after").split(","));
                };
            }
            Include.addImports(node.getAttribute("import-script").split(","), callback);
        }
        if (node.hasAttribute && node.hasAttribute("import-async")) {
            if (node.getAttribute("import-async") == "false")
                Include.setAsyncLoading(false);
            else
                Include.setAsyncLoading(true);
        }
        if (!nodeType.includes("-"))
            return;
        if (this.m_registered.hasOwnProperty(nodeType)) {
            this.m_registered[nodeType].addImport();
        }
    }
    checkAllComponents() {
        for (let compo in this.m_registered) {
            let all = document.getElementsByTagName(compo);
            if (all.length > 0) {
                this.m_registered[compo].addImport();
            }
        }
    }
    registerComponent(tag, includePath) {
        if (!this.m_registered.hasOwnProperty(tag.toUpperCase())) {
            let reg = new ComponentRegister();
            reg.import = includePath;
            reg.tagname = tag.toUpperCase();
            this.m_registered[tag.toUpperCase()] = reg;
        }
    }
}
let g_ComponentMgr = new ComponentMgr();
g_ComponentMgr.registerComponent("new-range-element", "/templates/OptionsMenu/Range/Range.html");
g_ComponentMgr.registerComponent("widget-header", "/templates/Widgets/WidgetHeader/WidgetHeader.html");
g_ComponentMgr.registerComponent("progress-bar", "/templates/progressBar/progressBar.html");
Coherent.on('UpdateGlobalVar', updateGlobalVar);
Coherent.on("SwitchVRModeState", (state) => {
    g_externalVariables.vrMode = state;
});
function updateGlobalVar(key, value) {
    g_externalVariables[key] = value;
    switch (key) {
        case 'minTextSize':
            updateMinimalTextSize(value);
            break;
        case 'colorPreset':
            updateColorPreset(value);
            break;
        case 'backgroundOpacity':
            updateBackgroundOpacity(value);
            break;
        case 'showTooltips':
            updateShowTooltip(value);
            break;
        case 'animationsEnabled':
            updateAnimationsEnabled(value);
            break;
        case 'uiScaling':
            updateUiScaling(value);
            break;
        case 'vrMode':
            break;
        case 'debugMode':
            updateDebugMode(value);
            break;
        case 'cursorSize':
            break;
        case 'navigationMode':
            let mode = value;
            UINavigation.switchNativigationMode(mode);
            break;
        case 'useScreenReader':
        case 'debugScreenReader':
            ScreenReader.updateStatus();
            break;
        case 'exclusiveFocusGuid':
            updateExclusiveFocusGuid(value);
            break;
        case 'instrumentDescriptionTooltipsDelay':
            break;
        case 'instrumentNameTooltipsDelay':
            break;
        default:
            console.warn('[GLOBAL VAR] Key unrecognized: ' + key);
    }
}
const sizeVariables = ['--fontSizeDeviceButton', '--fontSizeParagraph', '--fontSizeDefault', '--fontSizeMedium', '--fontSizeBig', '--fontSizeXXL'];
function updateMinimalTextSize(size) {
    let documentStyle = getComputedStyle(document.documentElement);
    document.documentElement.style.setProperty('--minimalFontSize', size.toString());
    for (let variable of sizeVariables) {
        let originalSize = parseInt(documentStyle.getPropertyValue(variable.replace('fontS', 's')));
        if (size >= originalSize) {
            if (variable === '--fontSizeDeviceButton') {
                document.documentElement.style.setProperty(variable, `calc(var(--screenHeight) * (${size * 0.83}px / 1080))`);
            }
            else {
                document.documentElement.style.setProperty(variable, `calc(var(--screenHeight) * (${size}px / 1080))`);
            }
        }
        else {
            document.documentElement.style.setProperty(variable, `calc(var(--screenHeight) * (${originalSize}px / 1080))`);
        }
    }
}
let currentDebugMode = null;
function updateDebugMode(value) {
    if (currentDebugMode)
        document.body.removeAttribute(currentDebugMode);
    currentDebugMode = value;
    document.documentElement.setAttribute(currentDebugMode, "");
}
function updateUiScaling(scale) {
    g_externalVariables.uiScaling = scale;
    CoherentSetup.updateScreenSize();
}
function updateShowTooltip(show) {
    if (!show) {
        Utils.hideTooltip("");
    }
    window.dispatchEvent(new Event("updateExternal:showTooltips"));
}
function updateExclusiveFocusGuid(focusGuid) {
    if (focusGuid && focusGuid !== UINavigation.currentExclusiveFocusGuid) {
        if (UINavigation.currentExclusiveFocusGuid === UINavigation.myExclusiveFocusGuid
            && focusGuid !== UINavigation.myExclusiveFocusGuid) {
            UINavigation.clearNonFocusedPanel();
        }
        UINavigation.currentExclusiveFocusGuid = focusGuid;
    }
}
var g_tipMgr;
class TipsMgr {
    constructor() {
        this.tipsMap = {};
    }
    static create() {
        if (!g_tipMgr)
            g_tipMgr = new TipsMgr();
    }
    CreateTips(_elem, _strId, _strTipDesc) {
        let tipId = "TIP_" + _strId.replace(/[\{\}]/g, "");
        _elem.setAttribute("data-description", tipId);
        this.tipsMap[tipId] = Coherent.translate(_strTipDesc);
    }
    CreateChoiceTips(_elem, _strId, _daChoiceDescs, _default) {
        for (let indexDescription = 0; indexDescription < _daChoiceDescs.length; indexDescription++) {
            let tipId = "TIP_" + _strId.replace(/[\{\}]/g, "") + "_" + indexDescription;
            if (indexDescription == _default) {
                _elem.setAttribute("data-description", tipId);
            }
            this.tipsMap[tipId] = Coherent.translate(_daChoiceDescs[indexDescription]);
        }
    }
    displayTip(tipId, forcedTipsContainer, bDisplayChangePrivilege = false) {
        let tipsContainer;
        if (forcedTipsContainer) {
            tipsContainer = forcedTipsContainer;
        }
        else {
            tipsContainer = window.document.getElementById("TipsContainer");
        }
        let span = document.createElement('span');
        span.classList.add('paragraph-with-buttons');
        span.innerHTML = this.tipsMap[tipId];
        Utils.RemoveAllChildren(tipsContainer.getContent());
        tipsContainer.addRealChild(span);
        let buttonContainer = document.getElementById("PrivilegeButtonContainer");
        if (buttonContainer) {
            buttonContainer.classList.toggle("hide", !bDisplayChangePrivilege);
        }
    }
}
var COLOR_PRESETS;
(function (COLOR_PRESETS) {
    COLOR_PRESETS["DEFAULT"] = "--color-cyan/--color-yellow";
    COLOR_PRESETS["HIGH_CONTRAST"] = "#1900FF/#F0C808";
    COLOR_PRESETS["PROTANOPIA"] = "#5a81df/#e4ca14";
    COLOR_PRESETS["PROTANOPIA_HIGH_CONTRAST"] = "#0011FF/#FFDF00";
    COLOR_PRESETS["DEUTERANOPIA"] = "#2f86e5/#ffbf32";
    COLOR_PRESETS["DEUTERANOPIA_HIGH_CONTRAST"] = "#002ECD/#ffce83";
    COLOR_PRESETS["TRITANOPIA"] = "#d53031/#00929c";
    COLOR_PRESETS["TRITANOPIA_HIGH_CONTRAST"] = "#fd1700/#00edff";
})(COLOR_PRESETS || (COLOR_PRESETS = {}));
function updateColorPreset(preset) {
    let [mainColor, accentColor] = COLOR_PRESETS[preset].split('/');
    if (mainColor.indexOf('--') == 0)
        mainColor = `var(${mainColor})`;
    if (accentColor.indexOf('--') == 0)
        accentColor = `var(${accentColor})`;
    document.documentElement.style.setProperty('--primaryColor', mainColor);
    document.documentElement.style.setProperty('--accentColor', accentColor);
}
function updateBackgroundOpacity(opacity) {
    let normalizedOpacity = Utils.Clamp(opacity / 100, 0.2, 1);
    document.documentElement.style.setProperty('--backgroundColorPanel', `rgba(0, 0, 0, ${normalizedOpacity})`);
    document.documentElement.style.setProperty('--backgroundColorComponent', `rgba(0, 0, 0, ${normalizedOpacity / 2})`);
}
function updateAnimationsEnabled(enabled) {
    document.documentElement.classList.toggle('animationsEnabled', enabled);
}
var _optiPow10 = [];
function fastPow10(_frac) {
    var coef = _optiPow10[_frac];
    if (isNaN(coef)) {
        coef = Math.pow(10, _frac);
        _optiPow10[_frac] = coef;
    }
    return coef;
}
function fastToFixed(_val, _fraction) {
    if (_val !== null) {
        return _val.toFixed(_fraction);
    }
    return _val;
}
function prepareForSetText(_element) {
    _element.textContent = ' ';
    return _element.firstChild;
}
function setText(_node, _text) {
    _node.nodeValue = _text;
}
function diffAndSetText(_element, _newValue) {
    if (_element && _element.textContent != _newValue) {
        _element.textContent = _newValue;
    }
}
function diffAndSetHTML(_element, _newValue) {
    if (_element && _element.innerHTML != _newValue) {
        _element.innerHTML = _newValue;
    }
}
function diffAndSetAttribute(_element, _attribute, _newValue) {
    if (_element && _element.getAttribute(_attribute) != _newValue) {
        _element.setAttribute(_attribute, _newValue);
    }
}
var StyleProperty;
(function (StyleProperty) {
    StyleProperty[StyleProperty["display"] = 0] = "display";
})(StyleProperty || (StyleProperty = {}));
function diffAndSetStyle(_element, _property, _newValue) {
    if (_element) {
        switch (_property) {
            case StyleProperty.display:
                if (_element.style.display != _newValue)
                    _element.style.display = _newValue;
                break;
        }
    }
}
var KeyCode;
(function (KeyCode) {
    KeyCode.KEY_CANCEL = 3;
    KeyCode.KEY_HELP = 6;
    KeyCode.KEY_BACK_SPACE = 8;
    KeyCode.KEY_TAB = 9;
    KeyCode.KEY_CLEAR = 12;
    KeyCode.KEY_RETURN = 13;
    KeyCode.KEY_ENTER = 13;
    KeyCode.KEY_SHIFT = 16;
    KeyCode.KEY_CONTROL = 17;
    KeyCode.KEY_ALT = 18;
    KeyCode.KEY_PAUSE = 19;
    KeyCode.KEY_CAPS_LOCK = 20;
    KeyCode.KEY_ESCAPE = 27;
    KeyCode.KEY_SPACE = 32;
    KeyCode.KEY_PAGE_UP = 33;
    KeyCode.KEY_PAGE_DOWN = 34;
    KeyCode.KEY_END = 35;
    KeyCode.KEY_HOME = 36;
    KeyCode.KEY_LEFT = 37;
    KeyCode.KEY_UP = 38;
    KeyCode.KEY_RIGHT = 39;
    KeyCode.KEY_DOWN = 40;
    KeyCode.KEY_PRINTSCREEN = 44;
    KeyCode.KEY_INSERT = 45;
    KeyCode.KEY_DELETE = 46;
    KeyCode.KEY_0 = 48;
    KeyCode.KEY_1 = 49;
    KeyCode.KEY_2 = 50;
    KeyCode.KEY_3 = 51;
    KeyCode.KEY_4 = 52;
    KeyCode.KEY_5 = 53;
    KeyCode.KEY_6 = 54;
    KeyCode.KEY_7 = 55;
    KeyCode.KEY_8 = 56;
    KeyCode.KEY_9 = 57;
    KeyCode.KEY_SEMICOLON = 59;
    KeyCode.KEY_EQUALS = 61;
    KeyCode.KEY_A = 65;
    KeyCode.KEY_B = 66;
    KeyCode.KEY_C = 67;
    KeyCode.KEY_D = 68;
    KeyCode.KEY_E = 69;
    KeyCode.KEY_F = 70;
    KeyCode.KEY_G = 71;
    KeyCode.KEY_H = 72;
    KeyCode.KEY_I = 73;
    KeyCode.KEY_J = 74;
    KeyCode.KEY_K = 75;
    KeyCode.KEY_L = 76;
    KeyCode.KEY_M = 77;
    KeyCode.KEY_N = 78;
    KeyCode.KEY_O = 79;
    KeyCode.KEY_P = 80;
    KeyCode.KEY_Q = 81;
    KeyCode.KEY_R = 82;
    KeyCode.KEY_S = 83;
    KeyCode.KEY_T = 84;
    KeyCode.KEY_U = 85;
    KeyCode.KEY_V = 86;
    KeyCode.KEY_W = 87;
    KeyCode.KEY_X = 88;
    KeyCode.KEY_Y = 89;
    KeyCode.KEY_Z = 90;
    KeyCode.KEY_LEFT_CMD = 91;
    KeyCode.KEY_RIGHT_CMD = 93;
    KeyCode.KEY_CONTEXT_MENU = 93;
    KeyCode.KEY_NUMPAD0 = 96;
    KeyCode.KEY_NUMPAD1 = 97;
    KeyCode.KEY_NUMPAD2 = 98;
    KeyCode.KEY_NUMPAD3 = 99;
    KeyCode.KEY_NUMPAD4 = 100;
    KeyCode.KEY_NUMPAD5 = 101;
    KeyCode.KEY_NUMPAD6 = 102;
    KeyCode.KEY_NUMPAD7 = 103;
    KeyCode.KEY_NUMPAD8 = 104;
    KeyCode.KEY_NUMPAD9 = 105;
    KeyCode.KEY_MULTIPLY = 106;
    KeyCode.KEY_ADD = 107;
    KeyCode.KEY_SEPARATOR = 108;
    KeyCode.KEY_SUBTRACT = 109;
    KeyCode.KEY_DECIMAL = 110;
    KeyCode.KEY_DIVIDE = 111;
    KeyCode.KEY_F1 = 112;
    KeyCode.KEY_F2 = 113;
    KeyCode.KEY_F3 = 114;
    KeyCode.KEY_F4 = 115;
    KeyCode.KEY_F5 = 116;
    KeyCode.KEY_F6 = 117;
    KeyCode.KEY_F7 = 118;
    KeyCode.KEY_F8 = 119;
    KeyCode.KEY_F9 = 120;
    KeyCode.KEY_F10 = 121;
    KeyCode.KEY_F11 = 122;
    KeyCode.KEY_F12 = 123;
    KeyCode.KEY_F13 = 124;
    KeyCode.KEY_F14 = 125;
    KeyCode.KEY_F15 = 126;
    KeyCode.KEY_F16 = 127;
    KeyCode.KEY_F17 = 128;
    KeyCode.KEY_F18 = 129;
    KeyCode.KEY_F19 = 130;
    KeyCode.KEY_F20 = 131;
    KeyCode.KEY_F21 = 132;
    KeyCode.KEY_F22 = 133;
    KeyCode.KEY_F23 = 134;
    KeyCode.KEY_F24 = 135;
    KeyCode.KEY_NUM_LOCK = 144;
    KeyCode.KEY_SCROLL_LOCK = 145;
    KeyCode.KEY_COMMA = 188;
    KeyCode.KEY_PERIOD = 190;
    KeyCode.KEY_SLASH = 191;
    KeyCode.KEY_BACK_QUOTE = 192;
    KeyCode.KEY_OPEN_BRACKET = 219;
    KeyCode.KEY_BACK_SLASH = 220;
    KeyCode.KEY_CLOSE_BRACKET = 221;
    KeyCode.KEY_QUOTE = 222;
    KeyCode.KEY_META = 224;
})(KeyCode || (KeyCode = {}));
class ISvgMapRootElement extends TemplateElement {
}
class EmptyCallback {
}
EmptyCallback.Void = () => { return; };
EmptyCallback.Boolean = (result) => { return; };
class IconCacheMgr {
    constructor() {
        this.m_cache = {};
        this.m_loading = {};
        this.m_loadingCallbacks = {};
    }
    loadURL(url, callback) {
        const useCache = true;
        if (useCache) {
            let cached = this.getCached(url);
            if (cached === null || cached !== undefined) {
                callback(cached !== null, cached);
                return;
            }
            if (!this.m_loadingCallbacks[url])
                this.m_loadingCallbacks[url] = [];
            this.m_loadingCallbacks[url].push(callback);
            if (this.m_loading[url]) {
                return;
            }
            this.m_loading[url] = true;
        }
        const httpRequest = new XMLHttpRequest();
        let svg = '';
        let mgr = this;
        httpRequest.onreadystatechange = function (data) {
            if (this.readyState === XMLHttpRequest.DONE) {
                let loaded = this.status === 200 || this.status === 0;
                if (loaded) {
                    mgr.addCachedAsString(url, this.responseText);
                }
                else {
                    mgr.addCachedAsString(url, null);
                }
                mgr.m_loading[url] = null;
                if (useCache) {
                    if (mgr.m_loadingCallbacks[url]) {
                        for (let cb of mgr.m_loadingCallbacks[url]) {
                            cb(loaded, this.responseText);
                        }
                        mgr.m_loadingCallbacks[url] = null;
                    }
                }
                else {
                    callback(loaded, this.responseText);
                }
            }
        };
        httpRequest.open("GET", url);
        httpRequest.send();
    }
    addCachedAsString(url, content) {
        if (!this.m_cache.hasOwnProperty(url)) {
            this.m_cache[url] = content;
        }
    }
    getCached(url) {
        return this.m_cache[url];
    }
}
window["IconCache"] = new IconCacheMgr;
function getIconCacheMgr() { return window["IconCache"]; }
class IconElement extends UIElement {
    constructor() {
        super();
        this.iconsPath = '/icons/';
        this.image = null;
        this.onIconLoaded = (found, svgAsString) => {
            if (found) {
                this.svgAsString = svgAsString;
                this.createContent();
                this.dispatchEvent(new Event('iconElementLoaded', { bubbles: true }));
            }
            else {
                if (this.onerror) {
                    this.onerror(null);
                }
            }
        };
    }
    connectedCallback() {
        this.refreshDataUrl();
    }
    set iconUrl(src) {
        if (this.iconUrl != src && src != undefined) {
            this.setAttribute("icon-url", src);
        }
    }
    get iconUrl() {
        if (this.hasAttribute("icon-url"))
            return this.getAttribute("icon-url");
        return "";
    }
    refreshDataUrl() {
        if (this.hasAttribute('data-url')) {
            var url = this.getAttribute('data-url').toString();
            if (!url.includes("%")) {
                url = encodeURI(url);
            }
            if (url && url !== '') {
                if (url.toLocaleLowerCase().endsWith(".svg")) {
                    this.getSvg(url);
                }
                else {
                    this.setImage(url);
                }
            }
        }
        else if (this.hasAttribute('icon-url')) {
            var url = this.getAttribute('icon-url').toString();
            if (url && url !== '') {
                if (url.toLocaleLowerCase().endsWith(".svg")) {
                    this.getSvg(encodeURI(this.getAttribute('icon-url')));
                }
                else {
                    this.setImage(url);
                }
            }
        }
        else if (this.hasAttribute('data-icon')) {
            var icon = this.getAttribute('data-icon');
            if (icon && icon !== '') {
                this.getSvg(encodeURI(this.iconsPath + this.getAttribute('data-icon') + '.svg'));
            }
        }
    }
    htmlToElement(html) {
        var template = document.createElement('template');
        template.innerHTML = html;
        return template.content.firstChild;
    }
    getSvg(url) {
        getIconCacheMgr().loadURL(url, this.onIconLoaded);
    }
    createContent() {
        Utils.RemoveAllChildren(this);
        this.image = null;
        let svgAsHtml = this.htmlToElement(this.svgAsString);
        svgAsHtml.classList.add('icon');
        if (svgAsHtml != undefined)
            this.appendChild(svgAsHtml);
    }
    static get observedAttributes() {
        return super.observedAttributes.concat(['data-url', 'icon-url', 'data-icon']);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (this.isConnected) {
            switch (name) {
                case 'data-url':
                case 'icon-url':
                case 'data-icon':
                    this.refreshDataUrl();
                    break;
            }
        }
    }
    setImage(url) {
        this.imagePaths = url.split(';');
        if (!this.image) {
            this.image = document.createElement('img');
            this.image.classList.add("hide");
            this.image.onload = this.imageFound.bind(this);
            this.image.onerror = this.imageNotFound.bind(this);
            this.appendChild(this.image);
        }
        this.image.src = encodeURI(this.imagePaths[0].trim());
    }
    imageFound() {
        this.image.classList.remove("hide");
    }
    imageNotFound() {
        this.image.onload = null;
        this.image.onerror = null;
        if (this.imagePaths.length > 1) {
            var path = "/Textures/Menu/Control/unknown Device/Layout.png";
            this.image.src = path;
            this.image.classList.remove("hide");
        }
    }
}
window.customElements.define("icon-element", IconElement);
window.document.addEventListener('DOMContentLoaded', () => {
    for (let key in g_externalVariables) {
        updateGlobalVar(key, g_externalVariables[key]);
    }
    for (let key in window.top.globalVars) {
        updateGlobalVar(key, window.top.globalVars[key]);
    }
});
//# sourceMappingURL=common.js.map