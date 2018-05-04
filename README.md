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

// call any number of times... for sync
ab.append(something);

// or for async
var cb = ab.asyncAppend();  // returns callback
someAsyncOperation(cb);

// call this at least once
ab.complete();
```

- no `mainCallBack()` will happen until you issue a `complete()`

- `mainCallBack(null, results)` is invoked once after the last `cb()` with no errors.

- `mainCallBack(err)` is invoked once after the first `cb(err)`.

- the original order of `append()` and `asyncAppend()` operations is respected in the results,
even if asyncAppend results arrive out of order.

- if there are only append operations, or no appends at all, `complete()`
will trigger `mainCallBack()` on nextTick.

- calling `append()` or `asyncAppend()` after `complete()` will result in an error.

### note

-  it doesn't make sense to call `asyncAppend()` from within an async operation.
   Ordering will be wrong, and `complete()` will probably have been called already.
   Instead, call `asyncAppend()` *before* the async operation
   and pass the function returned by `asyncAppend()` as the operation's async callback

### license

(c) 2015-2018 Jürgen Leschner, [MIT](http://opensource.org/licenses/MIT) license