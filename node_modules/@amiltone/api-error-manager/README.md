# Amiltone API Error package

This package delivers a class list for implementing global error handling layer.

## Structure

```
| APIErrors
  | APIError
    | ForbiddenError
    | InternalError
    | MissingFieldError
    | NotFoundError
    | TooLongURIError
    | JWTError
    | MongoDBError
    | ... Your custom errors which extends from APIError
| ErrorHandler
```

## Supported third parties errors

This package could natively treat errors of following packages :

- mongoDB
- jsonwebtoken
  - Missing token
  - Malformed token
  - Missing signature
  - Invalid signature
  - All other errors are returned as unknown jwt errors

## Installation

You must configure your NPM CLI client to use Amiltone private NPM registry.

Type with the following command :
```bash
npm set registry http://192.168.10.46:4873
```

Then :

```bash
npm install --save @amiltone/api-error-manager
```

## Express error handling implementation sample

``` javascript
import * as ErrorManager from '@amiltone/api-error-manager';
app.use(ErrorManager.ErrorHandler);
```

This sample should be call after all routes middleware and before 404 catch.

If an error is returned by next built-in express function, it will be catched by error handler and returned to the client

## Use built-in errors methods
On the following example, we will use build-in Not Found error :

```javascript
import * as ErrorManager from '@amiltone/api-error-manager';

app.get('/user/:id', function (_req: any, _res: any, next: any): any {
    // Request to get user from req.params.id
    if (!user) {
      const errorDetails: Object = { errorSubCode: 1, errorSubMessage: 'User not found' };
      return next(new ErrorManager.NotFoundError(errorDetails));
    }
});
```

## Implement custom errors
You can implement your own custom errors by create class which extends of APIError parent Class.

```javascript
import * as ErrorManager from '@amiltone/api-error-manager';

class MyCustomError extends ErrorManager.APIError {
  constructor() {
    super(
      10000, // Unique numeric error code (To avoid conflict, use values over 10000)
      "My custom message",
      {}, // Free content error details
      400 // HTTP Status Code
    );
  }
};
```
## Availables built-in errors

### Internal Error

**Returned structure :**

| Propriété | Type | Valeur
| ---------- | --------- | ------------
| errorCode | Number | 1000
| errorMessage | String | An unexpected internal error has occured
| errorDetails | Object | Free content object
| statusCode | Number | 500

**Invocation sample :**

```javascript
import InternalError from '@amiltone/api-error-manager';

const error = new Error('test error');
throw new InternalError(error);
```


### Forbidden Error

**Returned structure :**

| Propriété | Type | Valeur
| ---------- | --------- | ------------
| errorCode | Number | 1010
| errorMessage | String | Forbidden request
| errorDetails | Object | Free content object
| statusCode | Number | 403

**Invocation sample :**

```javascript
import ForbiddenError from '@amiltone/api-error-manager';

throw new ForbiddenError({
  errorSubCode: 1,
  errorSubMessage: 'Your permissions do not allow you access to this resource',
  expected: 'admin',
  current: 'user'
});
```

### Missing field Error

**Returned structure :**

| Propriété | Type | Valeur
| ---------- | --------- | ------------
| errorCode | Number | 1020
| errorMessage | String | Missing field
| errorDetails | Object | -
| errorDetails.field | String | Missing field name
| statusCode | Number | 400

**Invocation sample :**

```javascript
import MissingFieldError from '@amiltone/api-error-manager';

throw new MissingFieldError('email');
```

### Too Long URI Error

**Returned structure :**

| Propriété | Type | Valeur
| ---------- | --------- | ------------
| errorCode | Number | 1030
| errorMessage | String | Too long URI
| statusCode | Number | 414

**Invocation sample :**

```javascript
import TooLongURIError from '@amiltone/api-error-manager';

throw new TooLongURIError();
```

### Not found error

**Returned structure :**

| Propriété | Type | Valeur
| ---------- | --------- | ------------
| errorCode | Number | 1040
| errorMessage | String | Not found resource
| errorDetails | Object | Free content object
| statusCode | Number | 404

**Invocation sample :**

```javascript
import NotFoundError from '@amiltone/api-error-manager';

throw new NotFoundError({
  errorSubCode: 1,
  errorSubMessage: 'User not found',
  entity: 'user',
  field: 'uuid',
  value: 1302
});
```
