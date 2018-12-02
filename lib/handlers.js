/**
 * 
 * Request handlers
 * 
 * 
 * 
 */

// Dependencies
import _data from './data';
import helpers from './helpers';
import config from './../config';

// Define the handlers
const handlers = {};



// Tokens
tokens = function(data, callback) {
  const accetableMethods = ['post', 'get', 'put', 'delete'];
  if (accetableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
const _tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
_tokens.post = function(data, callback) {
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if(phone && password) {
    _data.read('users', phone, function(err, userData) {
      if(!err && userData) {
        // Hash the sent password, and compare it to the password stored in the user object
        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If valid, create a new token with a random name. Set expiration date 1 hour in the future
          const tokenId = helpers.createRandomString(20);

          var expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            'phone' : phone,
            'id' : tokenId,
            'expires' : expires
          };

          // Store the token
          _data.create('tokens', tokenId, tokenObject, function(err) {
            if(!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { 'Error' : 'Could not create the new token'})
            }
          });
        } else {
          callback(400, { 'Error' : 'Password did not match the specified user\'s stored password' })
        }
      } else {
        callback(400, { 'Error' : 'Could not find the specified user'});
      }
    })
  } else {
    callback(400, { 'Error' : 'Missing required field(s)'});
  }
}

// Tokens - get
// Required data : id
// Optional data : none
_tokens.get = function(data, callback) {
  // Check that the id is valid
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;

  console.log('getting token', id);
  if(id){
    // Lookup the user
    _data.read('tokens', id, function(err, tokenData) {
      if(!err && tokenData) {
        callback(200, tokenData)
      } else {
        callback(404); 
      }
    });
  }else {
    callback(400, { 'Error' : 'Missing required field'});
  }
}

// Tokens - put
// Required data : id, extend
// Optional data : none
_tokens.put = function(data, callback) {
  // Check that the id is valid
  const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;
  const extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false;

  if(id && extend) {

    // Lookup the token
    _data.read('tokens', id, function(err, tokenData) {
      if(!err && tokenData) {

        // Check to make sure the token isn't already expired
        if(tokenData.expires > Date.now()) {

          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the new updates
          _data.update('tokens', id, tokenData, function(err) {
            console.log('here');
            if(!err) {
              callback(200);
            } else {
              callback(500, { 'Error' : 'Could not update the token\'s expiration'});
            }
          });
        } else {
          callback(400, { 'Error' : 'Specified token is expired.'})
        }
      } else {
        callback(400, { 'Error' : 'Specified token does not exist' });
      }
    })
  } else {
    callback(400, { 'Error' : 'Missing required field(s) or field(s) are invalid'});
  } 
}

// Tokens - delete
_tokens.delete = function(data, callback) {
    // Check that the phone number is valid
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
    if(id){
      // Lookup the token
      _data.read('tokens', id, function(err, data) {
        if(!err && data) {
          _data.delete('tokens', id, function(err) {
            if(!err) {
              callback(200);
            } else {
              callback(500, { 'Error' : 'Could not delete the specified token'});
            }
          });
        } else {
          callback(404, { 'Error' : 'Could not find the specified token'}); 
        }
      });
    }else {
      callback(400, { 'Error' : 'Missing required field'});
    }
}

// Verify if a given token id is currently valid for a given user
_tokens.verifyToken = function(id, phone, callback) {
  // Lookup the token
  _data.read('tokens', id, function(err, tokenData) {
    if(!err && tokenData) {
      if(tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  })
}

// Checks
checks = function(data, callback) {
  const accetableMethods = ['post', 'get', 'put', 'delete'];

  if (accetableMethods.indexOf(data.method) > -1) {
    _checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the checks methods
_checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// optional data: none

_checks.post = function(data, callback) {
  // Validate inputs
  const { 
    payload: {
      protocol : reqProtocol,
      url : reqUrl,
      method: reqMethod,
      successCodes: reqSuccessCodes,
      timeoutSeconds: reqTimeoutSeconds
    }
  } = data

  const parsedPayload = {
    protocol : typeof(reqProtocol) == 'string' && 
    ['https', 'http'].indexOf(reqProtocol) > -1 ? reqProtocol.trim() : false,

    url : typeof(reqUrl) === 'string' && reqUrl.trim().length > 0 ?
      reqUrl.trim() : false,

    method : typeof(reqMethod) == 'string' && 
      ['post', 'get', 'put', 'delete'].indexOf(reqMethod) > -1 ? reqMethod.trim() : false,

    successCodes : typeof(reqSuccessCodes) === 'object' && 
      reqSuccessCodes instanceof Array &&
      reqSuccessCodes.length > 0 ?
      reqSuccessCodes : false,

    timeoutSeconds : typeof(reqTimeoutSeconds) === 'number' &&
      reqTimeoutSeconds % 1 === 0 &&
      reqTimeoutSeconds >= 1 &&
      reqTimeoutSeconds <= 5 ?
      reqTimeoutSeconds :
      false
  }

  !Object.keys(parsedPayload).some(key => !parsedPayload[key])

  const {
    protocol,
    url,
    method,
    successCodes,
    timeoutSeconds
  } = parsedPayload;

  // Get the token from the headers
  const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

  if (!Object.keys(parsedPayload).some(key => !parsedPayload[key])) {

    

    // Lookup the user by reading the token
    _data.read('tokens', token, function(err, tokenData){
      if(!err && tokenData) {
        const userPhone = tokenData.phone;

        // Lookup the user data
        _data.read('users', userPhone, function(err, userData) {
          if(!err && userData) {
            const userChecks = 
              typeof(userData.checks) === 'object' && 
              userData.checks instanceof Array ?
              userData.checks :
              [];
            // Verify that the user has less than the number of max-checks-per-user
            if (userChecks.length < config.maxChecks) {
              // Create a random id for the check
              const checkId = helpers.createRandomString(20);

              // Create the check object, and include the user's phone
              const checkObject = {
                'id' : checkId,
                'userPhone' : userPhone,
                'protocol' : protocol,
                'url' : url,
                'method' : method,
                'successcodes' : successCodes,
                'timeotSeconds': timeoutSeconds
              };

              // Save the object
              _data.create('checks', checkId, checkObject, function(err) {
                if(!err) {
                  // Add the check id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update('users', userPhone, userData, function(err) {
                    if(!err) {
                      // Return the data about the new check
                      callback(200, checkObject);
                    } else {
                      callback(500, { 'Error' : 'Could not update the user with the new check'});
                    }
                  });
                } else {
                  callback(500, { 'Error': 'Could not create the new check'})
                }

              });
            } else {
              callback(400, { 'Error': `The user already has the maximum number of checks (${config.maxChecks})`});
            }
          }
        });
      } else {
        callback(403);
      }
    });
  }
}

// Checks - get
// Required data : id
// Optional data : none
_checks.get = function(data, callback) {
    // Check that the id is valid
    const id = typeof(data.queryStringObject.id) === 'string' &&
      data.queryStringObject.id.trim().length === 20 ?
      data.queryStringObject.id.trim() :
      false;
    if(id) {

      // Lookup the check
      _data.read('checks', id, function(err, checkData) {
        if(!err && checkData) {

        } else {
          callback(404);
        }
      });
      // Get the token from the headers
      const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
      // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
        if(tokenIsValid) {
          // Return the check data
          callback(200, checkData);
        } else {
          callback(403)
        }
      })
    } else {
      callback(400, { 'Error' : 'Missing required field'});
    }
};

// Sample handler
ping = function(data, callback) {
  // Callbackk a http status code, and a payload object
  callback(200);
}

// Not found handler
notFound = function(data, callback) {
  callback(404);
}

// Export the module
export {
  ping,
  notFound,
};