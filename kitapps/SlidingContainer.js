
Ext.define('KA.SlidingContainer', {
    extend: 'Ext.Container',
    xtype: 'sliding-container',

    config: {
        leftMenu: null,
        rightMenu: null,
        mainView: null,

        // this is kinda private config fields
        menuState: 'none',
        dragState: 'none'
    },

    leftMenuConfig: {
        left: 0,
        zIndex: 1
    },
    rightMenuConfig: {
        right: 0,
        zIndex: 2
    },
    mainViewConfig: {
        top: 0,
        zIndex: 3,
        draggable: {
            direction: 'horizontal',
            constraint: {
                min: { x: -Infinity, y: -Infinity },
                max: { x: Infinity, y: Infinity }
            }
        }
    },

    constructor: function () {
        this.onDrag = _.throttle(this.onDrag, 100);
        this.callParent(arguments);
    },

    applyLeftMenu: function (item) {
        return this._factoryItem(item, this.leftMenuConfig);
    },
    applyRightMenu: function (item) {
        return this._factoryItem(item, this.rightMenuConfig);
    },
    applyMainView: function (item) {
        return this._factoryItem(item, this.mainViewConfig);
    },

    updateLeftMenu: function (newItem, oldItem) {
        this._replaceItem(newItem, oldItem);
    },
    updateRightMenu: function (newItem, oldItem) {
        this._replaceItem(newItem, oldItem);
    },
    updateMainView: function (newItem, oldItem) {
        this._replaceItem(newItem, oldItem);
        this._bindDragListeners();
    },

    _factoryItem: function (item, config) {
        if (item) {        
            item = this.factoryItem(item);
            item.setConfig(config);
        }
        return item;
    },

    _replaceItem: function (newItem, oldItem) {
        // all listeners will get unbound on 'remove'
        this.remove(oldItem);
        if (newItem) {
            this.add(newItem);
            newItem.on('painted', this._updateConstraints, this, {single: true});
        }
        else {
            this._updateConstraints();
        }
    },

    _bindDragListeners: function () {
        var mainView = this.getMainView();
        if (mainView) {
            mainView.getDraggable().on({
                drag: this.onDrag,
                dragend: this.onDragEnd,
                scope: this
            });
            mainView.element.on({
                swipe: this.onSwipe,
                scope: this
            });
        }
    },

    _updateConstraints: function () {
        var mainView       = this.getMainView(),
            leftMenu       = this.getLeftMenu(),
            rightMenu      = this.getRightMenu(),
            draggable      = mainView && mainView.getDraggable(),
            constraint     = draggable && draggable.getConstraint(),
            leftMenuWidth  = leftMenu ? leftMenu.element.getWidth() : 0,
            rightMenuWidth = rightMenu ? rightMenu.element.getWidth() : 0;
        if (mainView) {
            Ext.Object.merge(constraint, {
                min: { x: 0 - rightMenuWidth },
                max: { x: leftMenuWidth }
            });
            draggable.setConstraint(constraint);
        }
    },

    // throttled in constructor
    onDrag: function (draggable, event, x, y) {
        if (x > 0) {
            this.setDragState('right');
        }
        else {
            this.setDragState('left');
        }
    },

    onDragEnd: function (draggable, event, x, y) {
        var self = this;
        // we need deferring to detect swipes
        setTimeout(function () {
            self._calculateMenuState(x);
        }, 0);
    },

    onSwipe: function (event) {
        this._swipeDetected = event.direction;
    },

    _calculateMenuState: function (offset) {
        var mainView       = this.getMainView(),
            leftMenu       = this.getLeftMenu(),
            rightMenu      = this.getRightMenu(),
            leftMenuWidth  = leftMenu ? leftMenu.element.getWidth() : 0,
            rightMenuWidth = rightMenu ? rightMenu.element.getWidth() : 0,
            swipe          = this._swipeDetected,
            currentState   = this.getMenuState(),
            threshold      = 0.5;
        if (swipe) {
            switch (currentState) {
                case 'none':
                    switch (swipe) {
                        case 'left':
                            this.setMenuState('right');
                            break;
                        case 'right':
                            this.setMenuState('left');
                            break;
                    }
                    break;
                case 'left':
                case 'right':
                    this.setMenuState('none');
            }
        }
        else {
            switch (true) {
                case offset > 0 && offset > leftMenuWidth*threshold:
                    this.setMenuState('left');
                    break;
                case offset < 0 && (-offset) > rightMenuWidth*threshold:
                    this.setMenuState('right');
                    break;
                default:
                    this.setMenuState('none');
            }
        }
        this._swipeDetected = null;
    },

    updateDragState: function (dragState) {
        switch (dragState) {
            case 'right':
                this.getLeftMenu().setZIndex(2);
                this.getRightMenu().setZIndex(1);
                break;
            case 'left':
                this.getLeftMenu().setZIndex(1);
                this.getRightMenu().setZIndex(2);
                break;
        }
    },

    applyMenuState: function (state) {
        var mainView = this.getMainView(),
            leftMenu = this.getLeftMenu(),
            rightMenu = this.getRightMenu(),
            draggable = mainView && mainView.getDraggable(),
            leftMenuWidth = leftMenu ? leftMenu.element.getWidth() : 0,
            rightMenuWidth = rightMenu ? rightMenu.element.getWidth() : 0,
            newOffset;
        if (mainView) {
            switch (state) {
                case 'none':
                    this.setDragState('none');
                    newOffset = 0;
                    break;
                case 'left':
                    newOffset = leftMenuWidth;
                    break;
                case 'right':
                    newOffset = -rightMenuWidth;
                    break;
            }
            draggable.setOffset(newOffset, 0, {duration: 100});
        }
        return state;
    }

});
