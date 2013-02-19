# backbone-structured-events #

The Backbone Structured Events (BSE) module re-orders the internally cataloged flat-list of string-defined [Backbone.js](http://backbonejs.org/) events into an object hierarchy. So, instead of something like this:

![Default Backbone Event Structure](https://raw.github.com/holt/backbone-structured-events/master/img/events-before.png)

... you'll get something like this:

![Rejigged Backbone Event Structure](https://raw.github.com/holt/backbone-structured-events/master/img/events-after.png)

Group operations - for example, placing wrappers around sets of events - are now easier to implement in a structured hierarchy. Consequently, the BSE library provides a few additional methods that allow us to take advantage of this new object model.

## Installation ##

BSE can run either as a standalone event broker or as a replacement to Backbone's internal event module. The only hard dependency is [Underscore.js](http://underscorejs.org/) which must be included in your page/app.

## Examples ##

All existing [Backbone Event API](http://backbonejs.org/#Events) module methods will work as expected when using BSE. The following sections describe additional methods.

### `deepTrigger` ###

    // Create an object with a Backbone.Events mixin
    var obj = _.extend({}, Backbone.Events);
    
    // Create some callbacks
    var first = function () {
       console.log('First:  pre-initialization event...');
       return this;
    }, second = function () {
       console.log('Second: pre-initialization event...');
       return this;
    }, show = function () {
       console.log('Show:   dialog is displayed...');
       return this;
    }, last = function () {
       console.log('Last:  the dialog does something else...');
       return this;
    };
    
    // Bind some events - this can happen in no particular order as the
    // object structure is created or extended deterministically
    obj.on('app.dialog.pre.first', first);
    obj.on('app.dialog.pre.second', second);
    obj.on('app.dialog.show.post', last);
    obj.on('app.dialog.show', show);
    
    // Deep trigger all events on and under and object, all events under
    // an object, all events on an object
    obj.deepTrigger('app.dialog');        // first, second, show, last
    obj.deepTrigger('app.dialog.pre');    // first, second
    obj.deepTrigger('app.dialog.show');   // show, last
    obj.deepTrigger('app.dialog.show.*'); // last

    // Shallow trigger still works as expected
    obj.trigger('app.dialog.show'); // show