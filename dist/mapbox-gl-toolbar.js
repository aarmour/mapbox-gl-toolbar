(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.MapboxToolbar = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./src/toolbar_control');

},{"./src/toolbar_control":9}],2:[function(require,module,exports){
'use strict';
var Coordinate = function Coordinate(column, row, zoom) {
    this.column = column;
    this.row = row;
    this.zoom = zoom;
};
Coordinate.prototype.clone = function clone() {
    return new Coordinate(this.column, this.row, this.zoom);
};
Coordinate.prototype.zoomTo = function zoomTo(zoom) {
    return this.clone()._zoomTo(zoom);
};
Coordinate.prototype.sub = function sub(c) {
    return this.clone()._sub(c);
};
Coordinate.prototype._zoomTo = function _zoomTo(zoom) {
    var scale = Math.pow(2, zoom - this.zoom);
    this.column *= scale;
    this.row *= scale;
    this.zoom = zoom;
    return this;
};
Coordinate.prototype._sub = function _sub(c) {
    c = c.zoomTo(this.zoom);
    this.column -= c.column;
    this.row -= c.row;
    return this;
};
module.exports = Coordinate;
},{}],3:[function(require,module,exports){
'use strict';
module.exports = self;
},{}],4:[function(require,module,exports){
'use strict';
var Point = require('point-geometry');
var window = require('./window');
exports.create = function (tagName, className, container) {
    var el = window.document.createElement(tagName);
    if (className)
        el.className = className;
    if (container)
        container.appendChild(el);
    return el;
};
var docStyle = window.document.documentElement.style;
function testProp(props) {
    for (var i = 0; i < props.length; i++) {
        if (props[i] in docStyle) {
            return props[i];
        }
    }
    return props[0];
}
var selectProp = testProp([
    'userSelect',
    'MozUserSelect',
    'WebkitUserSelect',
    'msUserSelect'
]);
var userSelect;
exports.disableDrag = function () {
    if (selectProp) {
        userSelect = docStyle[selectProp];
        docStyle[selectProp] = 'none';
    }
};
exports.enableDrag = function () {
    if (selectProp) {
        docStyle[selectProp] = userSelect;
    }
};
var transformProp = testProp([
    'transform',
    'WebkitTransform'
]);
exports.setTransform = function (el, value) {
    el.style[transformProp] = value;
};
function suppressClick(e) {
    e.preventDefault();
    e.stopPropagation();
    window.removeEventListener('click', suppressClick, true);
}
exports.suppressClick = function () {
    window.addEventListener('click', suppressClick, true);
    window.setTimeout(function () {
        window.removeEventListener('click', suppressClick, true);
    }, 0);
};
exports.mousePos = function (el, e) {
    var rect = el.getBoundingClientRect();
    e = e.touches ? e.touches[0] : e;
    return new Point(e.clientX - rect.left - el.clientLeft, e.clientY - rect.top - el.clientTop);
};
exports.touchPos = function (el, e) {
    var rect = el.getBoundingClientRect(), points = [];
    var touches = e.type === 'touchend' ? e.changedTouches : e.touches;
    for (var i = 0; i < touches.length; i++) {
        points.push(new Point(touches[i].clientX - rect.left - el.clientLeft, touches[i].clientY - rect.top - el.clientTop));
    }
    return points;
};
exports.remove = function (node) {
    if (node.parentNode) {
        node.parentNode.removeChild(node);
    }
};
},{"./window":3,"point-geometry":7}],5:[function(require,module,exports){
'use strict';
var util = require('./util');
var Evented = function Evented() {
};
Evented.prototype.on = function on(type, listener) {
    this._listeners = this._listeners || {};
    this._listeners[type] = this._listeners[type] || [];
    this._listeners[type].push(listener);
    return this;
};
Evented.prototype.off = function off(type, listener) {
    if (this._listeners && this._listeners[type]) {
        var index = this._listeners[type].indexOf(listener);
        if (index !== -1) {
            this._listeners[type].splice(index, 1);
        }
    }
    return this;
};
Evented.prototype.once = function once(type, listener) {
    var this$1 = this;
    var wrapper = function (data) {
        this$1.off(type, wrapper);
        listener.call(this$1, data);
    };
    this.on(type, wrapper);
    return this;
};
Evented.prototype.fire = function fire(type, data) {
    var this$1 = this;
    if (this.listens(type)) {
        data = util.extend({}, data, {
            type: type,
            target: this
        });
        var listeners = this._listeners && this._listeners[type] ? this._listeners[type].slice() : [];
        for (var i = 0; i < listeners.length; i++) {
            listeners[i].call(this$1, data);
        }
        if (this._eventedParent) {
            this._eventedParent.fire(type, util.extend({}, data, this._eventedParentData));
        }
    } else if (util.endsWith(type, 'error')) {
        console.error(data && data.error || data || 'Empty error event');
    }
    return this;
};
Evented.prototype.listens = function listens(type) {
    return this._listeners && this._listeners[type] || this._eventedParent && this._eventedParent.listens(type);
};
Evented.prototype.setEventedParent = function setEventedParent(parent, data) {
    this._eventedParent = parent;
    this._eventedParentData = data;
    return this;
};
module.exports = Evented;
},{"./util":6}],6:[function(require,module,exports){
'use strict';
var UnitBezier = require('unitbezier');
var Coordinate = require('../geo/coordinate');
var Point = require('point-geometry');
exports.easeCubicInOut = function (t) {
    if (t <= 0)
        return 0;
    if (t >= 1)
        return 1;
    var t2 = t * t, t3 = t2 * t;
    return 4 * (t < 0.5 ? t3 : 3 * (t - t2) + t3 - 0.75);
};
exports.bezier = function (p1x, p1y, p2x, p2y) {
    var bezier = new UnitBezier(p1x, p1y, p2x, p2y);
    return function (t) {
        return bezier.solve(t);
    };
};
exports.ease = exports.bezier(0.25, 0.1, 0.25, 1);
exports.clamp = function (n, min, max) {
    return Math.min(max, Math.max(min, n));
};
exports.wrap = function (n, min, max) {
    var d = max - min;
    var w = ((n - min) % d + d) % d + min;
    return w === min ? max : w;
};
exports.asyncAll = function (array, fn, callback) {
    if (!array.length) {
        return callback(null, []);
    }
    var remaining = array.length;
    var results = new Array(array.length);
    var error = null;
    array.forEach(function (item, i) {
        fn(item, function (err, result) {
            if (err)
                error = err;
            results[i] = result;
            if (--remaining === 0)
                callback(error, results);
        });
    });
};
exports.values = function (obj) {
    var result = [];
    for (var k in obj) {
        result.push(obj[k]);
    }
    return result;
};
exports.keysDifference = function (obj, other) {
    var difference = [];
    for (var i in obj) {
        if (!(i in other)) {
            difference.push(i);
        }
    }
    return difference;
};
exports.extend = function (dest, source0, source1, source2) {
    var arguments$1 = arguments;
    for (var i = 1; i < arguments.length; i++) {
        var src = arguments$1[i];
        for (var k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
};
exports.pick = function (src, properties) {
    var result = {};
    for (var i = 0; i < properties.length; i++) {
        var k = properties[i];
        if (k in src) {
            result[k] = src[k];
        }
    }
    return result;
};
var id = 1;
exports.uniqueId = function () {
    return id++;
};
exports.bindAll = function (fns, context) {
    fns.forEach(function (fn) {
        if (!context[fn]) {
            return;
        }
        context[fn] = context[fn].bind(context);
    });
};
exports.getCoordinatesCenter = function (coords) {
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    for (var i = 0; i < coords.length; i++) {
        minX = Math.min(minX, coords[i].column);
        minY = Math.min(minY, coords[i].row);
        maxX = Math.max(maxX, coords[i].column);
        maxY = Math.max(maxY, coords[i].row);
    }
    var dx = maxX - minX;
    var dy = maxY - minY;
    var dMax = Math.max(dx, dy);
    return new Coordinate((minX + maxX) / 2, (minY + maxY) / 2, 0).zoomTo(Math.floor(-Math.log(dMax) / Math.LN2));
};
exports.endsWith = function (string, suffix) {
    return string.indexOf(suffix, string.length - suffix.length) !== -1;
};
exports.mapObject = function (input, iterator, context) {
    var this$1 = this;
    var output = {};
    for (var key in input) {
        output[key] = iterator.call(context || this$1, input[key], key, input);
    }
    return output;
};
exports.filterObject = function (input, iterator, context) {
    var this$1 = this;
    var output = {};
    for (var key in input) {
        if (iterator.call(context || this$1, input[key], key, input)) {
            output[key] = input[key];
        }
    }
    return output;
};
exports.deepEqual = function (a, b) {
    if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length)
            return false;
        for (var i = 0; i < a.length; i++) {
            if (!exports.deepEqual(a[i], b[i]))
                return false;
        }
        return true;
    }
    if (typeof a === 'object' && a !== null && b !== null) {
        if (!(typeof b === 'object'))
            return false;
        var keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length)
            return false;
        for (var key in a) {
            if (!exports.deepEqual(a[key], b[key]))
                return false;
        }
        return true;
    }
    return a === b;
};
exports.clone = function (input) {
    if (Array.isArray(input)) {
        return input.map(exports.clone);
    } else if (typeof input === 'object' && input) {
        return exports.mapObject(input, exports.clone);
    } else {
        return input;
    }
};
exports.arraysIntersect = function (a, b) {
    for (var l = 0; l < a.length; l++) {
        if (b.indexOf(a[l]) >= 0)
            return true;
    }
    return false;
};
var warnOnceHistory = {};
exports.warnOnce = function (message) {
    if (!warnOnceHistory[message]) {
        if (typeof console !== 'undefined')
            console.warn(message);
        warnOnceHistory[message] = true;
    }
};
exports.isCounterClockwise = function (a, b, c) {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
};
exports.calculateSignedArea = function (ring) {
    var sum = 0;
    for (var i = 0, len = ring.length, j = len - 1, p1, p2; i < len; j = i++) {
        p1 = ring[i];
        p2 = ring[j];
        sum += (p2.x - p1.x) * (p1.y + p2.y);
    }
    return sum;
};
exports.isClosedPolygon = function (points) {
    if (points.length < 4)
        return false;
    var p1 = points[0];
    var p2 = points[points.length - 1];
    if (Math.abs(p1.x - p2.x) > 0 || Math.abs(p1.y - p2.y) > 0) {
        return false;
    }
    return Math.abs(exports.calculateSignedArea(points)) > 0.01;
};
exports.sphericalToCartesian = function (spherical) {
    var r = spherical[0];
    var azimuthal = spherical[1], polar = spherical[2];
    azimuthal += 90;
    azimuthal *= Math.PI / 180;
    polar *= Math.PI / 180;
    return [
        r * Math.cos(azimuthal) * Math.sin(polar),
        r * Math.sin(azimuthal) * Math.sin(polar),
        r * Math.cos(polar)
    ];
};
},{"../geo/coordinate":2,"point-geometry":7,"unitbezier":8}],7:[function(require,module,exports){
'use strict';

module.exports = Point;

function Point(x, y) {
    this.x = x;
    this.y = y;
}

Point.prototype = {
    clone: function() { return new Point(this.x, this.y); },

    add:     function(p) { return this.clone()._add(p);     },
    sub:     function(p) { return this.clone()._sub(p);     },
    mult:    function(k) { return this.clone()._mult(k);    },
    div:     function(k) { return this.clone()._div(k);     },
    rotate:  function(a) { return this.clone()._rotate(a);  },
    matMult: function(m) { return this.clone()._matMult(m); },
    unit:    function() { return this.clone()._unit(); },
    perp:    function() { return this.clone()._perp(); },
    round:   function() { return this.clone()._round(); },

    mag: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    equals: function(p) {
        return this.x === p.x &&
               this.y === p.y;
    },

    dist: function(p) {
        return Math.sqrt(this.distSqr(p));
    },

    distSqr: function(p) {
        var dx = p.x - this.x,
            dy = p.y - this.y;
        return dx * dx + dy * dy;
    },

    angle: function() {
        return Math.atan2(this.y, this.x);
    },

    angleTo: function(b) {
        return Math.atan2(this.y - b.y, this.x - b.x);
    },

    angleWith: function(b) {
        return this.angleWithSep(b.x, b.y);
    },

    // Find the angle of the two vectors, solving the formula for the cross product a x b = |a||b|sin(θ) for θ.
    angleWithSep: function(x, y) {
        return Math.atan2(
            this.x * y - this.y * x,
            this.x * x + this.y * y);
    },

    _matMult: function(m) {
        var x = m[0] * this.x + m[1] * this.y,
            y = m[2] * this.x + m[3] * this.y;
        this.x = x;
        this.y = y;
        return this;
    },

    _add: function(p) {
        this.x += p.x;
        this.y += p.y;
        return this;
    },

    _sub: function(p) {
        this.x -= p.x;
        this.y -= p.y;
        return this;
    },

    _mult: function(k) {
        this.x *= k;
        this.y *= k;
        return this;
    },

    _div: function(k) {
        this.x /= k;
        this.y /= k;
        return this;
    },

    _unit: function() {
        this._div(this.mag());
        return this;
    },

    _perp: function() {
        var y = this.y;
        this.y = this.x;
        this.x = -y;
        return this;
    },

    _rotate: function(angle) {
        var cos = Math.cos(angle),
            sin = Math.sin(angle),
            x = cos * this.x - sin * this.y,
            y = sin * this.x + cos * this.y;
        this.x = x;
        this.y = y;
        return this;
    },

    _round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
};

// constructs Point from an array if necessary
Point.convert = function (a) {
    if (a instanceof Point) {
        return a;
    }
    if (Array.isArray(a)) {
        return new Point(a[0], a[1]);
    }
    return a;
};

},{}],8:[function(require,module,exports){
/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Ported from Webkit
 * http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/platform/graphics/UnitBezier.h
 */

module.exports = UnitBezier;

function UnitBezier(p1x, p1y, p2x, p2y) {
    // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
    this.cx = 3.0 * p1x;
    this.bx = 3.0 * (p2x - p1x) - this.cx;
    this.ax = 1.0 - this.cx - this.bx;

    this.cy = 3.0 * p1y;
    this.by = 3.0 * (p2y - p1y) - this.cy;
    this.ay = 1.0 - this.cy - this.by;

    this.p1x = p1x;
    this.p1y = p2y;
    this.p2x = p2x;
    this.p2y = p2y;
}

UnitBezier.prototype.sampleCurveX = function(t) {
    // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
    return ((this.ax * t + this.bx) * t + this.cx) * t;
};

UnitBezier.prototype.sampleCurveY = function(t) {
    return ((this.ay * t + this.by) * t + this.cy) * t;
};

UnitBezier.prototype.sampleCurveDerivativeX = function(t) {
    return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx;
};

UnitBezier.prototype.solveCurveX = function(x, epsilon) {
    if (typeof epsilon === 'undefined') epsilon = 1e-6;

    var t0, t1, t2, x2, i;

    // First try a few iterations of Newton's method -- normally very fast.
    for (t2 = x, i = 0; i < 8; i++) {

        x2 = this.sampleCurveX(t2) - x;
        if (Math.abs(x2) < epsilon) return t2;

        var d2 = this.sampleCurveDerivativeX(t2);
        if (Math.abs(d2) < 1e-6) break;

        t2 = t2 - x2 / d2;
    }

    // Fall back to the bisection method for reliability.
    t0 = 0.0;
    t1 = 1.0;
    t2 = x;

    if (t2 < t0) return t0;
    if (t2 > t1) return t1;

    while (t0 < t1) {

        x2 = this.sampleCurveX(t2);
        if (Math.abs(x2 - x) < epsilon) return t2;

        if (x > x2) {
            t0 = t2;
        } else {
            t1 = t2;
        }

        t2 = (t1 - t0) * 0.5 + t0;
    }

    // Failure.
    return t2;
};

UnitBezier.prototype.solve = function(x, epsilon) {
    return this.sampleCurveY(this.solveCurveX(x, epsilon));
};

},{}],9:[function(require,module,exports){
'use strict';

const Evented = require('mapbox-gl/js/util/evented');
const DOM = require('mapbox-gl/js/util/dom');

const className = 'mapboxgl-ctrl';
const expandedClassName = `${ className }-toolbar-expanded`;

class ToolbarControl extends Evented {

  constructor(options = { buttons: [] }) {
    super();
    this.options = options;
  }

  onAdd(map) {
    this._map = map;
    this._container = DOM.create('div', `${ className } ${ className }-group ${ className }-toolbar`, map.getContainer());

    this.options.buttons.forEach(buttonProps => {
      this._createButton(buttonProps);
    });

    this._toggleButton = DOM.create('button', `${ className }-toolbar-toggle`, this._container);
    this._toggleButton.innerHTML = '&hellip;';
    this._toggleButton.addEventListener('click', this._toggle.bind(this));

    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }

  _createButton(buttonProps) {
    const button = DOM.create('button', null, this._container);
    this._createButtonIcon(button, buttonProps.iconClass, buttonProps.iconLigature);
    if (buttonProps.mobile === false) button.classList.add(`${ className }-toolbar-hidden`);
  }

  _createButtonIcon(button, iconClassName, ligature) {
    const icon = DOM.create('span', `${ className }-toolbar-icon ${ iconClassName }`, button);
    icon.textContent = ligature;
  }

  _toggle() {
    this._container.classList[this._container.classList.contains(expandedClassName) ? 'remove' : 'add'](expandedClassName);
  }

}

module.exports = ToolbarControl;

},{"mapbox-gl/js/util/dom":4,"mapbox-gl/js/util/evented":5}]},{},[1])(1)
});