backbone-structured-events
==========================

The Backbone Structured Events (BSE) extension re-orders the internally cataloged flat-list of string-defined Backbone events into an object hierarchy. We're going to turn this:

![Default Backbone Event Structure](https://raw.github.com/holt/backbone-structured-events/master/img/events-before.png)

... into this:

![Rejigged Backbone Event Structure](https://raw.github.com/holt/backbone-structured-events/master/img/events-after.png)

... and add a few additional methods that allow us to take advantage of this structured hierarchy.

    // Create an object with the Backbone.Events mixin
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
    
    // Trigger all events on and under and object, all events under
    // an object, all events on an object
    
    obj.deepTrigger('app.dialog');        // first, second, show, last
    obj.deepTrigger('app.dialog.pre');    // first, second
    obj.deepTrigger('app.dialog.show');   // show, last
    obj.deepTrigger('app.dialog.show.*'); // last
    obj.trigger('app.dialog.show');       // show