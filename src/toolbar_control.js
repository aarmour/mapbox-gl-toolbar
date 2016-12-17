'use strict';

const Evented = require('mapbox-gl/js/util/evented');
const DOM = require('mapbox-gl/js/util/dom');

const className = 'mapboxgl-ctrl';
const expandedClassName = `${className}-toolbar-expanded`;

class ToolbarControl extends Evented {

  constructor(options = { buttons: [] }) {
    super();
    this.options = options;
  }

  onAdd(map) {
    this._map = map;
    this._container = DOM.create('div', `${className} ${className}-group ${className}-toolbar`, map.getContainer());

    this.options.buttons.forEach(buttonProps => {
      this._createButton(buttonProps);
    });

    this._toggleButton = DOM.create('button', `${className}-toolbar-toggle`, this._container);
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
    this._createButtonIcon(button, buttonProps.iconClass, buttonProps.iconLigature)
  }

  _createButtonIcon(button, iconClassName, ligature) {
    const icon = DOM.create('span', `${className}-toolbar-icon ${iconClassName}`, button);
    icon.textContent = ligature;
  }

  _toggle() {
    this._container.classList[this._container.classList.contains(expandedClassName) ? 'remove' : 'add'](expandedClassName);
  }

}

module.exports = ToolbarControl;
