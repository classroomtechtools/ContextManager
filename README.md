# ContextManager

Create a "body function," which has the following "set up" and "tear down" abilities:

- Define a "head function" that executes immediately prior to the body function
- Define an "tail function" that executes upon completion of the body function, even if an error occurs
- Define an "error function" that is called whenever an error occurs. If the error function returns null, the error is swallowed
- Save state by using the `this` keyword from within head, body, or tail

All of the above are optional.

**Example**

A common pattern where this library would be useful is when you are working with spreadsheets and the `LockService` in tandem. In order to prevent your own script from overwriting your own updates, you need to create a lock at the script level, then do your writes, then you need to call `SpreadsheetApp.flush()` to write changes. When you enable the lock, you might get an error (as `waitLock` throws an error if unable to establish a lock).

```js
/* 
/* Update spreadsheet
/* @returns error message if error happens, else null
*/
function myFunction () {
  const context = ContextManager.new_();  // creates class
  // define head function
  context.head = function () {
    console.log(1);
    this.error = null;
    this.lock = LockService.getScriptLock();
    this.lock.waitLock(300);  // timeout of 300
  };
  // now create body function with first parameter
  context.body = function () {
    console.log(2);
    SpreadsheetApp... // update the spreadsheet, inside a lock
    this.updated = true;
    return this.error;
  };
  // define tail function
  context.tail = function () {
    console.log(3);
    SpreadsheetApp.flush();
    this.lock.releaseLock();
  };
  // define what happens when an error is thrown
  context.error = function (err) {
    console.log(-1);
    this.error = err;
  };
  return context.execute();
}

/* if no error, output is:
   1 2 3 (head body tail) */
/* if error happens in head function, output is:
   1 -1 3 (head error tail, but not body) */
/* if error occurs in body function, output is:
   1 2 -1 3 (head body error tail) */
```

With the above code, the body function's execution is surrounded by the `head` function before, and the `tail` function after, *even if an error occurs*.

## Getting Started

Project code is: ``

The following silly example illustrates how `this` holds state throughout each of the functions:

```js
function myFunction () {
    // initialize
    let ctx = ContextManager.new_();
    
    // save an array to state
    ctx.head = function () {
        this.noun = "World";
        this.log = [];
    };
    
    // output the array to the logger
    ctx.tail = function () {
        Logger.log(this.log.join('\n'));
    };
    
    // execute the main body, head and tail will be called
    ctx.body = function () {
        this.log.push(`Hello ${this.noun}`);
    };

    ctx.execute();
    // Logger outputs "Hello World"
}
```

By default, `this` is just a regular object. If you want it to be something else, then you can set state ahead of time:

```js
function myFunction () {
  let ctx = ContextManager.new_([]);  // pass array which is state object

  ctx.head = function () { 
    this.log.push('heading');
  };
  ctx.tail = function () { 
    this.log.push('tailing');
    Logger.log(this.log.join('\n'));
  };
  ctx.error = function () { 
    this.log.push('See no error, hear no error');
    return null;  // return null swallows the error
  };   
  ctx.param = "World";

  ctx.with(function (text) {
    this.log.push('Inside body');
    throw Error("Error here, but does not actually error out");	
  });
}
```

Output:

```
heading
Inside body
See no error, hear no error
tailing
```

## Movitation

Context managers are a concept in Python that is really quite useful. In my case, I use them to implement unit testing, as a unit test may possibly fail, but we want the code to continue executing.
