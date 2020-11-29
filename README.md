# ContextManager

Create a "body function" which performs some target work, but which has some sort of "set up" and/or "tear down" work to do:

- Define a "head function" that executes immediately prior to the body function
- Define a "tail function" that executes upon completion of the body function, even if an error occurs
- Define an "error function" that is called when an error happens inside head, body, or tail.
- Save "state" by using the `this` keyword from within head, body, or tail

## Getting Started

Project code is: `MY_Ti1O7GqK78zDPukpS-gnnHlT3Tf0e1`. The default identifier is `ContextManager`, you use the `.create` function to get the context variable, on which you declare the head, body, and tail as needed.

This package is documented with jsdoc, and so [API details are fully documented](https://classroomtechtools.github.io/ContextManager/index.html). You'll notice that the online IDE has limited ability to read jsdoc properly, so please do use the API for a full explanation.

## Example 1

```js
/**
 * A simple (and useless) context manager that illustrates patterns
 */
function myFunction () {
  const context = ContextManager.create();
  context.head = function (param) {
    // this will be state, by default just an object
    this.inHead = true;
  };
  context.body = function (param) {
    this.inBody = true;
    return param;
  };
  context.tail = function (param) {
    this.inTail = true;
  }
  const result = context.execute("echo");
  Logger.log(result);  
  //     echo
  Logger.log(context.state);  
  //     {inHead: true, inTail: true, inBody: true};
}
```

**Sequences**

By default, this is the order in which execution occurs. Please see below example for more clarity:

- `1` is head function
- `2` is body function
- `3` is tail function
- `-1` is error function

Regular sequence (with no error occurring) `1 2 3` (head body tail)

If error happens in head function, sequence is `1 -1 3` (head error tail, but not body).

If an error occurs in body function, sequence is:
`1 2 -1 3` (head body error tail) 

If an error occurs in the tail function, sequence is:
`1 2 3, -1` (head, body, tail, error)

*Note*: If an error occurs in the error function, then the sequence will be interrupted at the `-1` stage with no further execution; that is the intended behaviour.

**Error Handling**

If the error function returns `null` (which by default it does not), the error is "swallowed" (not raised as an error). However, the error object itself is returned by `.execute`.

**Body returning value**

The body can return some value which is returned from `.execute`. If an error occurs in body function and the error function returns null, the error itself is returned instead. If an error occurs in the tail function (and thus the body function has successfully return some value or `undefined` if no explicit return) and the error function returns `null`, then the error object is given additional property `ctx.body.result` with the return value of the body function.

## Application

A common pattern where this library would be useful is when you are working with spreadsheets and the `LockService` in tandem. In order to prevent your own script from overwriting your own updates, you need to create a lock at the script level, then do your writes, then you need to call `SpreadsheetApp.flush()` to write changes. When you enable the lock, you might get an error (as `waitLock` throws an error if it was unable to establish a lock).

```js
/* 
/* Update spreadsheet
/* @returns error message if error happens, else null
*/
function myFunction () {
  const context = ContextManager.create();  // creates instance of class
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
    return null;  // "instructs context manager to 'swallow' the error"
  };

  return context.execute();
  //             ^--- this actually executes it all
}
```

## Example 2

The following silly example illustrates how `this` holds state throughout each of the functions, and how you can use `.execute` to pass parameters which can change how the body function works:

```js
function myFunction () {
    // initialize
    let ctx = ContextManager.create();
    
    // save an array to state
    ctx.head = function () {
        this.noun = "World";
    };
      
    // execute the main body, head and tail will be called
    ctx.body = function (delim) {
        this.expression = `Hello${delim}${this.noun}`;
    };

    // output the array to the logger
    ctx.tail = function () {
        Logger.log(this.expression);
    };

    ctx.execute(', ');
    // Logger outputs "Hello, World"

    ctx.execute(' ');
    // Logger outputs "Hello World" (with no comma)
}
```

By default, `this` is just a regular object. If you want it to be something else, then you can set its state ahead of time:

```js
function myFunction () {
  let ctx = ContextManager.create({state: []});  // pass array which is state object

  ctx.head = function () { 
    this.push('heading');
  };
  ctx.tail = function () { 
    this.push('tailing');
    Logger.log(this.log.join('\n'));
  };
  ctx.error = function () { 
    this.push('See no error, hear no error');
    return null;  // return null swallows the error
  };   
  ctx.param = "World";

  ctx.with(function (text) {
    this.push('Inside body');
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
