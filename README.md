# Mongoose: Modelling Relationships between Connected Data

## Referencing a document

```javascript
const courseSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Author",
  },
});
```

```javascript
const courseSchema = new mongoose.Schema({
  author: {
    type: new mongoose.Schema({
      name: String,
      bio: String,
    }),
  },
});
```

- Embedded documents don’t have a save method. They can only be saved in the context of their parent.

## Updating an embedded document

```javascript
const course = await Course.findById(courseId);
course.author.name = "New Name";
course.save();
```

- We don’t have transactions in MongoDB. To implement transactions, we use a pattern called **“Two Phase Commit”**. If we don’t want to manually implement this pattern, use the **[Fawn NPM package](https://www.npmjs.com/package/fawn)**:

### Implementing transactions using Fawn

```javascript
try {
  // All args in here treated all together as unit
  await new Fawn.Task()
    // First arg is collection we work with, and second is obj we wanna save
    .save("rentals", newRental)
    .update(
      "movies",
      { _id: movie._id },
      {
        $inc: { numberInStock: -1 },
      }
    )
    .run();
} catch (ex) {
  // 500 means Internal server error
  res.status(500).send("Something failed.");
}
```

## Object IDs

- ObjectIDs are generated by MongoDB driver and are used to uniquely identify a document. They consist of 12 bytes:
  - 4 bytes: timestamp
  - 3 bytes: machine identifier
  - 2 bytes: process identifier
  - 3 bytes: counter
- ObjectIDs are almost unique. In theory, there is a chance for two ObjectIDs to be equal but the odds are very low (1/16,000,000) for most real-world applications.

### Validating ObjectIDs

```javascript
mongoose.Types.ObjectID.isValid(id);
```

- To validate ObjectIDs using **[Joi](https://www.npmjs.com/package/joi)**, use **[joi-objectid NPM package](https://www.npmjs.com/package/joi-objectid)**.

# Authentication and Authorization

- **Authentication** is the process of determining if the user is who he/she claims to be. It involves validating their email/password.
- **Authorization** is the process of determining if the user has permission to perform a given operation.
- To hash passwords, we can use **[bcrypt](https://www.npmjs.com/package/bcrypt)**:

## Hashing passwords

```javascript
const salt = await bcrypt.genSalt(10);
const hashed = await bcrypt.hash(‘1234’, salt);
```

## Validating passwords

```javascript
const isValid = await bcrypt.compare(‘1234’, hashed);
```

- A **[JSON Web Token (JWT)](https://jwt.io/)** is a JSON object encoded as a long string. We use them to identify users. It’s similar to a passport or driver’s license. It includes a few public properties about a user in its payload. These properties cannot be tampered because doing so requires re-generating the digital signature.
- When the user logs in, we generate a **[JWT](https://jwt.io/)** on the server and return it to the client. We store this token on the client and send it to the server every time we need to call an API endpoint that is only accessible to authenticated users.
- To generate JSON Web Tokens in an Express app use **[jsonwebtoken package](https://www.npmjs.com/package/jsonwebtoken)**.

## Generating a **[JWT](https://jwt.io/)**

```javascript
const jwt = require(‘jsonwebtoken’);
const token = jwt.sign({ _id: user._id}, ‘privateKey’);
```

- We should never store private keys and other secrets in our codebase. Store them in environment variables. Use the **[config package](https://www.npmjs.com/package/config)** to read application settings stored in environment variables.
- When appropriate, encapsulate logic in **[Mongoose](https://www.npmjs.com/package/mongoose)** models:

### Adding a method to a Mongoose model

```javascript
userSchema.methods.generateAuthToken = function () {};
const token = user.generateAuthToken();
```

- Implement authorization using a middleware function. Return a 401 error (unauthorized) if the client doesn’t send a valid token. Return 403 (forbidden) if the user provided a valid token but is not allowed to perform the given operation.
- We don’t need to implement logging out on the server. Implement it on the client by simply removing the **[(JWT)](https://jwt.io/)** from the client.
- Do not store a **[(JWT)](https://jwt.io/)** in plain text in a database. This is similar to storing users’ passports or drivers license in a room. Anyone who has access to that room can steal these passports. Store **[(JWTs)](https://jwt.io/)** on the client. If we have a strong reason for storing them on the server, make sure to encrypt them before storing them in a database.

# Handling and Logging Errors

- Our applications don’t run in an ideal world. Unexpected errors can happen as a result of bugs in our code or issues in the running environment. For example, our MongoDB server may shut down, or a remote HTTP service we call may go down.
- We should count for these unexpected errors, log them and return a proper error to the client.
- We should use the Express error middleware to catch any unhandled exceptions in the “request processing pipeline”.
- We should register the error middleware after all the existing routes:

```javascript
app.use(function (err, req, res, next) {
  // Log the exception and return a friendly error to the client.
  res.status(500).send("Something failed");
});
```

- To pass control to the error middleware, we should wrap our route handler code in a try/catch block and call **next()**.
- Adding a try/catch block to every route handler is repetitive and time consuming. We should use **[express-async-errors](https://www.npmjs.com/package/express-async-errors)** module. This module will monkey-patch our route handlers at runtime. It’ll wrap our code within a try/catch block and pass unhandled errors to our error middleware.
- To log errors, we can use **[winston](https://www.npmjs.com/package/winston)**.
- **[Winston](https://www.npmjs.com/package/winston)** can log errors in multiple transports. A transport is where our log is stored.
- The core transports that come with **[Winston](https://www.npmjs.com/package/winston)** are **Console, File** and **Http**. There are also 3rd-party transports for storing logs in **MongoDB, CouchDB, Redis** and **Loggly**.
- The error middleware in Express only catches exceptions in the request processing pipeline. Any errors happening during the application startup (eg connecting to MongoDB) will be invisible to **Express**.
- We can use **process.on(‘uncaughtException’)** to catch unhandled exceptions, and **process.on(‘unhandledRejection’)** to catch rejected promises.
- As a best practice, in the event handlers we pass to **process.on()**, we should log the exception and exit the process, because our process may be in an unclean state and it may result in more issues in the future. It’s better to restart the process in a clean state. In production, we can use a process manager to automatically restart a Node process.

# Unit Testing

- Automated testing is the practice of writing code to test our code.
- Automated tests help us deliver software with fewer bugs and of better quality. They also help us refactor our code with confidence.
- **[Jest](https://www.npmjs.com/package/jest)** is a new trending popular testing framework recommended by Facebook. It comes with everything you need to write automated tests.
- We have 3 types of automated tests:
  - **Unit tests**: test a unit of an application without external resources (eg db)
  - **Integration tests**: test the application with external resources.
  - **Functional or end-to-end tests**: test the application through its UI.
- Tests should not be too general nor too specific. If they’re too general, they don’t give you much confidence that your code works. If they’re too specific, they become fragile and can break easily. As you write code, you have to spend extra unnecessary time to fix these broken tests.
- Mocking is replacing a real implementation of a function with a fake or mock function. It allows us to isolate our application code from its external resources.
- Popular Jest matcher functions:

## Equality

```javascript
expect(...).toBe();
expect(...).toEqual();
```

## Truthiness

```javascript
expect(...).toBeDefined();
expect(...).toBeNull();
expect(...).toBeTruthy();
expect(...).toBeFalsy();
```

## Numbers

```javascript
expect(...).toBeGreaterThan();
expect(...).toBeGreaterThanOrEqual();
expect(...).toBeLessThan();
expect(...).toBeLessThanOrEqual();
```

## Strings

```javascript
expect(...).toMatch(/regularExp/);
```

## Arrays

```javascript
expect(...).toContain();
```

## Objects

```javascript
expect(...).toBe(); // check for the equality of object references
expect(...).toEqual(); // check for the equality of properties
expect(...).toMatchObject();
```

## Exceptions

```javascript
expect(() => {
  someCode;
}).toThrow();
```

# Integration Tests

- Unit tests are easy to write, fast to execute and are ideal for testing functions with minimal or zero dependency on external resources.
- The more we use mock functions, the more our tests get coupled to the current implementation. If we change this implementation in the future, our tests will break. If we find ourself doing too much mocking, that’s when we need to replace our unit test with an integration test.
- With integration tests, we test our application with a real database. As a best practice, separate our test database from the development or production databases.
- We should write each integration test as if it is the only test in the world. Start with a clean state (database). Populate the database only with the data required by the test. Nothing more, nothing less. Clean up after our test using the **afterEach** function.
- Run jest with **—coverage** flag to get a code coverage report.
