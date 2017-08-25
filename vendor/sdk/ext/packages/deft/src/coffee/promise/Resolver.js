// Generated by CoffeeScript 1.6.3
/*
Copyright (c) 2012-2014 [DeftJS Framework Contributors](http://deftjs.org)
Open source under the [MIT License](http://en.wikipedia.org/wiki/MIT_License).
*/


/**
* @private
* Resolvers are used internally by Deferreds to create, resolve and reject
* Promises, and to propagate fulfillment and rejection.
*
* Developers never directly interact with a Resolver.
*
* Each Deferred has an associated Resolver, and each Resolver has an
* associated Promise. A Deferred delegates resolve() and reject() calls to
* its Resolver's resolve() and reject() methods. A Promise delegates
* then() calls to its Resolver's then() method. In this way, access to
* Resolver operations are divided between producer (Deferred) and consumer
* (Promise) roles.
*
* When a Resolver's resolve() method is called, it fulfills with the
* optionally specified value. If resolve() is called with a then-able
* (i.e.a Function or Object with a then() function, such as another
* Promise) it assimilates the then-able's result; the Resolver provides
* its own resolve() and reject() methods as the onFulfilled or onRejected
* arguments in a call to that then-able's then() function. If an error is
* thrown while calling the then-able's then() function (prior to any call
* back to the specified resolve() or reject() methods), the Resolver
* rejects with that error. If a Resolver's resolve() method is called with
* its own Promise, it rejects with a TypeError.
*
* When a Resolver's reject() method is called, it rejects with the
* optionally specified reason.
*
* Each time a Resolver's then() method is called, it captures a pair of
* optional onFulfilled and onRejected callbacks and returns a Promise of
* the Resolver's future value as transformed by those callbacks.
*/


(function() {
  Ext.define('Deft.promise.Resolver', {
    alternateClassName: ['Deft.Resolver'],
    requires: ['Deft.promise.Consequence'],
    /**
    	* @property {Deft.promise.Promise}
    	* Promise of the future value of this Deferred.
    */

    promise: null,
    /**
       * @private
    	* @property {Deft.promise.Consequence[]}
    	* Pending Consequences chained to this Resolver.
    */

    consequences: [],
    /**
       * @private
    	* @property {Boolean}
       * Indicates whether this Resolver has been completed.
    */

    completed: false,
    /**
       * @private
    	* @property {String}
       * The completion action (i.e. 'fulfill' or 'reject').
    */

    completionAction: null,
    /**
       * @private
    	* @property {Mixed}
       * The completion value (i.e. resolution value or rejection error).
    */

    completionValue: null,
    constructor: function() {
      this.promise = Ext.create('Deft.promise.Promise', this);
      this.consequences = [];
      this.completed = false;
      this.completionAction = null;
      this.completionValue = null;
      return this;
    },
    /**
    	* Used to specify onFulfilled and onRejected callbacks that will be
    	* notified when the future value becomes available.
    	*
    	* Those callbacks can subsequently transform the value that was
    	* fulfilled or the error that was rejected. Each call to then()
    	* returns a new Promise of that transformed value; i.e., a Promise
    	* that is fulfilled with the callback return value or rejected with
    	* any error thrown by the callback.
    	*
    	* @param {Function} onFulfilled (Optional) callback to execute to transform a fulfillment value.
    	* @param {Function} onRejected (Optional) callback to execute to transform a rejection reason.
    	* @param {Function} onProgress (Optional) callback to execute to transform a progress value.
    	*
    	* @return Promise that is fulfilled with the callback return value or rejected with any error thrown by the callback.
    */

    then: function(onFulfilled, onRejected, onProgress) {
      var consequence;
      consequence = Ext.create('Deft.promise.Consequence', onFulfilled, onRejected, onProgress);
      if (this.completed) {
        consequence.trigger(this.completionAction, this.completionValue);
      } else {
        this.consequences.push(consequence);
      }
      return consequence.promise;
    },
    /**
    	* Resolve this Resolver with the (optional) specified value.
    	*
    	* If called with a then-able (i.e.a Function or Object with a then()
    	* function, such as another Promise) it assimilates the then-able's
    	* result; the Resolver provides its own resolve() and reject() methods
    	* as the onFulfilled or onRejected arguments in a call to that
    	* then-able's then() function.  If an error is  thrown while calling
    	* the then-able's then() function (prior to any call back to the
    	* specified resolve() or reject() methods), the Resolver rejects with
    	* that error. If a Resolver's resolve() method is called with its own
    	* Promise, it rejects with a TypeError.
    	*
    	* Once a Resolver has been fulfilled or rejected, it is considered to be complete
    	* and subsequent calls to resolve() or reject() are ignored.
    	*
    	* @param {Mixed} value Value to resolve as either a fulfillment value or rejection reason.
    */

    resolve: function(value) {
      var error, isHandled, self, thenFn;
      if (this.completed) {
        return;
      }
      try {
        if (value === this.promise) {
          throw new TypeError('A Promise cannot be resolved with itself.');
        }
        if ((Ext.isObject(value) || Deft.isFunction(value)) && Deft.isFunction(thenFn = value.then)) {
          isHandled = false;
          try {
            self = this;
            thenFn.call(value, function(value) {
              if (!isHandled) {
                isHandled = true;
                self.resolve(value);
              }
            }, function(error) {
              if (!isHandled) {
                isHandled = true;
                self.reject(error);
              }
            });
          } catch (_error) {
            error = _error;
            if (!isHandled) {
              this.reject(error);
            }
          }
        } else {
          this.complete('fulfill', value);
        }
      } catch (_error) {
        error = _error;
        this.reject(error);
      }
    },
    /**
    	* Reject this Resolver with the specified reason.
    	*
    	* Once a Resolver has been rejected, it is considered to be complete
    	* and subsequent calls to resolve() or reject() are ignored.
    	*
    	* @param {Error} reason Rejection reason.
    */

    reject: function(reason) {
      if (this.completed) {
        return;
      }
      this.complete('reject', reason);
    },
    /**
    	* Updates progress for this Resolver, if it is still pending, triggering it to execute the 'onProgress' callback and propagate the resulting transformed progress value to Resolvers that originate from this Resolver.
    	*
    	* @param {Mixed} progress The progress value.
    */

    update: function(progress) {
      var consequence, _i, _len, _ref;
      if (this.completed) {
        return;
      }
      _ref = this.consequences;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        consequence = _ref[_i];
        consequence.update(progress);
      }
    },
    /**
       * @private
    	* Complete this Resolver with the specified action and value.
    	*
    	* @param {String} action Completion action (i.e. 'fufill' or 'reject').
    	* @param {Mixed} value Fulfillment value or rejection reason.
    */

    complete: function(action, value) {
      var consequence, _i, _len, _ref;
      this.completionAction = action;
      this.completionValue = value;
      this.completed = true;
      _ref = this.consequences;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        consequence = _ref[_i];
        consequence.trigger(this.completionAction, this.completionValue);
      }
      this.consequences = null;
    }
  });

}).call(this);
