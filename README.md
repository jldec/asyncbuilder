# asyncbuilder

- builds an array containing a mix of immediate and async results
- follows node convention of using callbacks with signature `cb(err, results)`
- useful for building a sequential list in the order that async operations
  are invoked

### install

```sh
    npm install asyncbuilder
```

### usage

```js
// new is optional
var ab = new asyncbuilder(mainCallBack);

// call any number of times

// for sync
ab.append(something);

// or for async
var asyncCallBack = ab.asyncAppend(); // returns callback
someAsyncOperation(asyncCallback);

// call this is at least once
ab.complete();
```

- `mainCallBack(null,results)` is invoked automatically upon the last async callback

- the original order of `append()` and `asyncAppend()` operations is respected in the results,
even if asyncAppend results arrive out of order.

- if there are only append operations, or no appends at all, `complete()`
will trigger `mainCallBack()` on nextTick

- calling `complete()` before the last `append()` or `asyncAppend()` will result
in a "premature complete" error.

### note

1. you must use `complete()` or no callback will happen

2. it doesn't make sense to call `asyncAppend()` from within an async operation.
   Ordering will be wrong, and `complete()` will probably have been called already.
   Instead, call `asyncAppend()` *before* the async operation
   and pass the function returned by `asyncAppend()` as the operation's async callback

### license

(c) 2015 Jurgen Leschner, [MIT](http://opensource.org/licenses/MIT) license