var supportsPushState = !! history.pushState;

function Router() {
    var router = this;

    router.routeMap = {};

    if (window.addEventListener) {
        window.addEventListener('popstate', function() {
            router.goto(location.pathname);
        });
    }
}

Router.prototype = {

    closestA: function(start) {
        var parent = start.parentNode;
        while (parent != document.body && parent) {
            if (parent && parent.nodeName == 'A') {
                return parent;
            } else {
                parent = parent.parentNode;
            }
        }
        return null;
    },

    _dropTrailingSlash: function(pattern) {
        if (pattern[pattern.length - 1] === '/') {
            return pattern.substring(0, pattern.length);
        }

        return pattern;
    },

    get: function(pattern, handler) {
        this.routeMap[this._dropTrailingSlash(pattern)] = handler
    },

    goto: function(path) {
        var params, pattern, pathWithoutQueryString;

        path = this._dropTrailingSlash(path);

        if (path !== this._dropTrailingSlash(location.pathname)) {
            if (supportsPushState) {
                history.pushState({}, '', path);
            } else {
                window.location = path;
                return;
            }
        }

        pathWithoutQueryString = path.split('?')[0];

        for (pattern in this.routeMap) {
            if (params = this._match(pattern, pathWithoutQueryString)) {
                this.routeMap[pattern](params);
                return;
            }
        }

        throw '66: Route does not exist';
    },

    start: function() {
        this.goto(location.pathname);
    },

    captureAnchorTagClicks: function(element) {
        if (!element) {
            element = document;
        }

        element.addEventListener('click', this.handleClicks.bind(this));
    },

    handleClicks: function(e) {
        var element = e.target,
            href, target, isAnchor, isRelative, isLocal, anchor;

        if (element && element.nodeName == 'A') {
            anchor = element;
        } else {
            anchor = this.closestA(e.target); // returns null if no A is found
        }

        if (anchor) {
            href = anchor.attributes.href && anchor.attributes.href.textContent;
            target = anchor.attributes.target && anchor.attributes.target.textContent;
            isAnchor = href.indexOf('#') === 0;
            isRelative = href.indexOf('http') !== 0;
            isLocal = href.indexOf(location.origin) === 0;
            if (target !== '_blank' && (isRelative || isLocal) && !isAnchor) {
                // don't change page, use push state, return false for browsers with no preventDefault
                if (e.preventDefault) {
                    e.preventDefault();
                }

                this.goto(href);

                return false;
            }
        }
    },

    _match: function(pattern, url) {
        var varnames = pattern.match(/(:[a-zA-Z0-9_-]+)/g),
            re = new RegExp('^' + pattern.replace(/(:[a-zA-Z0-9_-]+)/g,
                '([a-zA-Z0-9_-]+)') + '/?$'),
            match = url.match(re),
            params = {},
            i = 1,
            varname;

        if (!match) {
            return null;
        }

        for (i = 1; i < match.length; i++) {
            varname = varnames[i - 1].substring(1)
            params[varname] = match[i]
        }

        return params
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
} else if (typeof define === 'function') {
    define(function() {
        return Router;
    });
} else {
    window['66'] = Router;
}
