'use strict';

const Evented = require('mapbox-gl/js/util/evented');
const DOM = require('mapbox-gl/js/util/dom');

const DEFAULT_OPTIONS = { buttons: [], collapseOnInteraction: false };

const className = 'mapboxgl-ctrl';
const expandedClassName = `${className}-toolbar-expanded`;

class ToolbarControl extends Evented {

  constructor(options = DEFAULT_OPTIONS) {
    super();
    this.options = options;
    this._buttons = {};
  }

  /**
   * IControl
   */

  onAdd(map) {
    this._map = map;
    this._container = DOM.create('div', `${className} ${className}-group ${className}-toolbar`, map.getContainer());
    this._eventListeners = [];

    this.options.buttons.forEach(buttonProps => {
      this._createButton(buttonProps);
    });

    this._toggleButton = DOM.create('button', `${className}-toolbar-toggle`, this._container);
    this._toggleButton.innerHTML = '&hellip;';
    this._toggleButton.addEventListener('click', this._toggle.bind(this));

    if (this.options.collapseOnInteraction) {
      this._addEventListener(map, 'touchend', this._toggle.bind(this, true));
      this._addEventListener(map, 'zoomend', this._toggle.bind(this, true));
      this._addEventListener(map, 'dragend', this._toggle.bind(this, true));
    }

    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
    this._removeEventListeners();
  }

  /**
   * Public methods
   */

  getButton(id) {
    return this._buttons[id];
  }

  /**
   * Private methods
   */

  _addEventListener(obj, type, fn) {
    this._eventListeners.push({ obj, type, fn });
    obj.on(type, fn);
  }

  _createButton(buttonProps) {
    const button = this._buttons[buttonProps.id] = DOM.create('button', null, this._container);
    this._createButtonIcon(button, buttonProps.iconClass, buttonProps.iconLigature);
    if (buttonProps.mobile === false) button.classList.add(`${className}-toolbar-hidden`);
  }

  _createButtonIcon(button, iconClassName, ligature) {
    const icon = DOM.create('span', `${className}-toolbar-icon ${iconClassName}`, button);
    icon.textContent = ligature;
  }

  _removeEventListeners() {
    this._eventListeners.forEach(listener => listener.obj.off(listener.type, listener.fn));
  }

  _toggle(off) {
    if (off === true || this._container.classList.contains(expandedClassName)) {
      this._container.classList.remove(expandedClassName);
    } else {
      this._container.classList.add(expandedClassName);
    }
  }

}

module.exports = ToolbarControl;
