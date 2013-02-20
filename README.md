# backbone-structured-events #

By default, the [Backbone.js](http://backbonejs.org/) Event module stores the callbacks bound to an object as a flat list of keypair values. Using a set of dot-notation delimited event names as an example, the event catalog looks something like this:

![Default Backbone Event Structure](https://raw.github.com/holt/backbone-structured-events/master/img/events-before.png)

The Backbone Structured Events (BSE) module organizes delimited-name events such as these into an object hierarchy, and instead produces this:

![Rejigged Backbone Event Structure](https://raw.github.com/holt/backbone-structured-events/master/img/events-after.png)

Because the event stack is now in an ordered hierarchy, group operations are easier to implement; for example, binding, unbinding, or placing common wrappers around groups of events. To illustrate this, the BSE library provides a few additional methods that allow us to take advantage of this new object model.

## Installation ##

BSE can run either as a standalone event broker (all methods are added to the `__Events__` object) or as a regression tested replacement for Backbone's internal `Backbone.Events` module (if detected). The only hard dependency is [Underscore.js](http://underscorejs.org/) which must be included in your page/app.

## Examples ##

All existing [Backbone Event API](http://backbonejs.org/#Events) module methods will work as expected when using BSE. The following sections describe additional methods.

#### .deepTrigger() ####

Create an object with a `Backbone.Events` mixin:

    var obj = _.extend({}, Backbone.Events);
    
Create some callbacks:

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
    
Bind some events; this can happen in no particular order as the object structure is created or extended deterministically:

    obj.on('app.dialog.pre.first', first);
    obj.on('app.dialog.pre.second', second);
    obj.on('app.dialog.show.last', last);
    obj.on('app.dialog.show', show);
    
Deep trigger all events:
- on *and* under an object
- under an object
- on an object


    obj.deepTrigger('app.dialog');        // first, second, show, last
    obj.deepTrigger('app.dialog.pre');    // first, second
    obj.deepTrigger('app.dialog.show');   // show, last
    obj.deepTrigger('app.dialog.show.*'); // last

Standard `.trigger()` still works as expected:

    obj.trigger('app.dialog.show'); // show


#### .destroy() ####

Unbind all *child* events on an object:

    obj.destroy('app.dialog.show.*'); 
    
Unbind *all* events on object:
    
    obj.destroy('app.dialog.show'); 
    
Standard `.off()` still works as expected. Unbinding all events on an object *without* unbinding any child events:
    
    obj.off('app.dialog.show'); 


#### .setSeperator() ####
    
The default seperator is a period `.` but you can change it to something else: 

    obj.setSeperator('-');