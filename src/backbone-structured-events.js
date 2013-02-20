// backbone-structured-events.js v0.1.8  

(function () {

   var root = this;

   // Create a local reference to array methods.
   var array = [];
   var slice = array.slice;

   // Backbone.Events
   // ---------------
   // Regular expression used to split event strings.
   var eventSplitter = /\s+/;

   // Implement fancy features of the Events API such as multiple event
   // names `"change blur"` and jQuery-style event maps `{change: action}`
   // in terms of the existing API.
   var eventsApi = function (obj, action, name, rest) {

      if (!name) return true;
      if (typeof name === 'object') {
         for (var key in name) {
            if (name.hasOwnProperty(key)) {
               obj[action].apply(obj, [key, name[key]].concat(rest));
            }
         }
      } else if (eventSplitter.test(name)) {
         var names = name.split(eventSplitter);
         for (var i = 0, l = names.length; i < l; i++) {
            obj[action].apply(obj, [names[i]].concat(rest));
         }
      } else {
         return true;
      }
   };

   // Optimized internal dispatch function for triggering events. Tries to
   // keep the usual cases speedy (most Backbone events have 3 arguments).
   var triggerEvents = function (events, args) {

      var ev, i = -1,
         l = events.length;
      switch (args.length) {
      case 0:
         while (++i < l) (ev = events[i]).callback.call(ev.ctx);
         return;
      case 1:
         while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0]);
         return;
      case 2:
         while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0], args[1]);
         return;
      case 3:
         while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0], args[1], args[2]);
         return;
      default:
         while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
      }
   };

   // A module that can be mixed in to *any object* in order to provide it with
   // custom events. You may bind with `on` or remove with `off` callback
   // functions to an event; `trigger`-ing an event fires all callbacks in
   // succession.
   //
   //     var object = {};
   //     _.extend(object, Backbone.Events);
   //     object.on('expand', function(){ alert('expanded'); });
   //     object.trigger('expand');
   //
   var Events = (function () {

      var seperator = '.';
      var toString = Object.prototype.toString;

      // Utility for getting the name of an object type
      var getType = function (obj) {
         return toString.call(obj).slice(8, -1);
      };

      // Create an object from a delimited string and bind to
      // an optional context.
      var setObj = function (str, ctx, sep) {

         ctx = ctx || window;
         str = str.split(sep || seperator);

         var obj, _i, _len;
         for (_i = 0, _len = str.length; _i < _len; _i++) {
            obj = str[_i];
            ctx = (ctx[obj] = ctx[obj] || {});
         }
         return ctx;
      };

      // Retrieve an object using a delimited string from an optional
      // context.
      var getObj = function (str, ctx, sep) {

         ctx = ctx || window;
         str = str.split(sep || seperator);

         var arr = _.filter(str, function (num) {
            return num.length;
         }),
            obj = null;

         obj = _.reduce(arr, function (prev, curr, index, list) {
            if (prev) {
               return prev[list[index]];
            }
         }, ctx);
         return obj;
      };

      // Reconstruct an object against true/false rules defined 
      // by an iterator
      var remap = function (obj, iterator, parentkey) {

         var key, _obj = {};

         if (getType(iterator) !== 'Function') return obj;
         if (getType(obj) === 'Object') {

            for (key in obj) {
               if (obj.hasOwnProperty(key) 
                  && iterator(key, obj[key], obj, parentkey)) {
                  _obj[key] = (getType(obj[key]) === 'Object') 
               ? remap(obj[key], iterator, key) 
               : obj[key];
               }
            }
         }
         return _obj;
      };

      // Scrub any matching context objects or callbacks from the list of events
      var scrubList = function (list, callback, context) {
         var events, j, k, ev;
         events = [];
         for (j = 0, k = list.length; j < k; j++) {
            ev = list[j];
            if ((callback && callback !== ev.callback 
               && callback !== ev.callback._callback) 
               || (context && context !== ev.context)) {
               events.push(ev);
            }
         }
         return events;
      };

      return {

         // Bind one or more space separated events, or an events map,
         // to a `callback` function. Passing `"all"` will bind the callback to
         // all events fired.
         on: function (name, callback, context) {
            if (!(eventsApi(this, 'on', name, [callback, context]) && callback)) return this;

            this._events || (this._events = {});
            var obj = getObj(name, this._events);
            var list = (obj && obj._events) || (setObj(name, this._events)._events = []);

            list.push({
               callback: callback,
               context: context,
               ctx: context || this
            });

            return this;
         },

         // Bind events to only be triggered a single time. After the first time
         // the callback is invoked, it will be removed.
         once: function (name, callback, context) {
            if (!(eventsApi(this, 'once', name, [callback, context]) && callback)) return this;
            var self = this;
            var once = _.once(function () {
               self.off(name, once);
               callback.apply(this, arguments);
            });
            once._callback = callback;
            this.on(name, once, context);
            return this;
         },

         // Remove one or many callbacks. If `context` is null, removes all
         // callbacks with that function. If `callback` is null, removes all
         // callbacks for the event. If `name` is null, removes all bound
         // callbacks for all events.
         off: function (name, callback, context) {

            if (!this._events 
               || !eventsApi(this, 'off', name, [callback, context])) return this;

            if (!name && !callback && !context) {
               this._events = {};
               return this;
            }

            // To remove named (or unamed) objects with optional contexts and callbacks we
            // must recursively remap the "_events" object. 
            //
            // Remapping (which may be side effectful) allows us to reconstruct everything 
            // within the "_events" hierarchy against a ruleset defined by an iterator. If
            // the iterator returns "true", the key is included in the remap, othewrwise it
            // is excluded.
            this._events = remap(this._events, function (key, value, parent, parentkey) {

               if (name) {
                  if (callback || context) {
                     if ((key === '_events') 
                        && ((name.split(seperator).pop()) === parentkey) 
                        && (getType(value) === 'Array')) {
                        parent[key] = scrubList(value, callback, context);
                     }
                     return true;
                  } else {
                     return (key === '_events') 
                     && ((name.split(seperator).pop()) === parentkey) ? false : true;
                  }
               } else if (callback || context) {
                  if ((key === '_events') && (getType(value) === 'Array')) {
                     parent[key] = scrubList(value, callback, context);
                  }
                  return true;
               } else return false;

            });

            // Remove any empty objects
            this._events = remap(this._events, function (key, value) {
               return _.isEmpty(value) ? false : true;
            });

            return this;
         },

         // Trigger one or many events, firing all bound callbacks. Callbacks are
         // passed the same arguments as `trigger` is, apart from the event name
         // (unless you're listening on `"all"`, which will cause your callback to
         // receive the true name of the event as the first argument).
         trigger: function (name) {
            if (!this._events) return this;
            var args = slice.call(arguments, 1);
            if (!eventsApi(this, 'trigger', name, args)) return this;

            var allEvents = this._events.all && this._events.all._events;
            var obj = getObj(name, this._events);
            var events = obj ? obj._events : false;

            if (events) triggerEvents(events, args);
            if (allEvents) triggerEvents(allEvents, arguments);
            return this;
         },

         // Change the seperator character(s) used to delimit event names
         setSeperator: function (sep) {
            seperator = (sep && sep.toString()) || seperator;
            return this;
         },

         // Deep removal of a namespace and all of its child objects (not just the
         // the events local to the namesapce)
         destroy: function (name) {

            if (!this._events 
               || !eventsApi(this, 'destroy', name)) return this;

            if (!name) {
               this._events = {};
               return this;
            }

            var names = name.split(seperator), wildcard = false;
            name = ("*" !== names[names.length - 1]) ? names.pop() 
            : (wildcard = !0) && names[names.length - 2];
            this._events = remap(this._events, function (key, value, parent, parentkey) {
               if (wildcard) {
                  return (name === parentkey && key !== '_events') ? false : true;
               }  
               else {
                  return (name === key) ? false : true;
               }
            });
            return this;
         },

         // Deep triggering of all events in a hierarchy, including or excluding any
         // present on the parent object itself
         deepTrigger: function (name) {

            if (!this._events) return this;
            var args = slice.call(arguments, 1);
            if (!eventsApi(this, 'deepTrigger', name, args)) return this;

            var names = name.split(seperator);
            var wildcard = false;
            var arr = [];
            var obj = {};

            name = ("*" !== names[names.length - 1]) 
            ? names[names.length - 1] 
            : (wildcard = !0) && names[names.length - 2];

            // Normalize the names array if the last entry is an asterisk
            wildcard && names.pop();

            // Grab the object matching the normalized name (if it exists)
            if (obj = getObj(names.join('.'), this._events)) {
               !wildcard && obj._events && arr.push(obj._events);
               remap(obj, function (key, value) {
                  value._events && arr.push(value._events);
                  return true;
               });
            }

            _.each(arr, function (events) {
               triggerEvents(events, args);
            });

            return this;
         },

         // An inversion-of-control version of `on`. Tell *this* object to listen to
         // an event in another object ... keeping track of what it's listening to.
         listenTo: function (obj, name, callback) {
            var listeners = this._listeners || (this._listeners = {});
            var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
            listeners[id] = obj;
            obj.on(name, typeof name === 'object' ? this : callback, this);
            return this;
         },

         // Tell this object to stop listening to either specific events ... or
         // to every object it's currently listening to.
         stopListening: function (obj, name, callback) {
            var listeners = this._listeners;
            if (!listeners) return this;
            var deleteListener = !name && !callback;
            if (typeof name === 'object') callback = this;
            if (obj) {(listeners = {})[obj._listenerId] = obj; }
            for (var id in listeners) {
               if (listeners.hasOwnProperty(id)) {
                  listeners[id].off(name, callback, this);
                  if (deleteListener) delete this._listeners[id];
               }
            }
            return this;
         }

      };

   }());

   if (root.Backbone) {
      _.extend(root.Backbone.Events, Events);
      _.extend(root.Backbone, Events);

   }
   else {
      root.__Events__ = Events
   }

}).call(this);