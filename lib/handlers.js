/**
 * 
 * Request handlers
 * 
 * 
 * 
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./../config');

// Define the handlers
const handlers = {};

// Users
handlers.users = function(data, callback) {
  const accetableMethods = ['post', 'get', 'put', 'delete'];
  if (accetableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, toAgreement
handlers._users.post = function(data, callback) {
  // Check that all required fields are filled out
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement === true ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that user doesn't already exist
    _data.read('users', phone, function(err, data) {
      if(err){
        // Hash the password'
        const hashedPassword = helpers.hash(password);

        if(hashedPassword) {
          // Create the user object
          const userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true
          };

          // Store the user
          _data.create('users', phone, userObject, function(err) {
            if(!err) {
              callback(200)
            } else {
              console.log(err);
              callback(500, { 'Error' : 'Cloud not create the new user'});
            }
          });
        } else {
          callback(500, { 'Error' : 'Could not hash the user\'s password' })
        }

      } else {
        // User already exists
        callback(400, { 'Error' : 'A user with that phone number already exists'});
      }
    });
  
  } else {
    callback(400, { 'Error' : 'Missing required fields'});
  }
};

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = function(data, callback) {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){

    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    // verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', phone, function(err, data) {
          if(!err && data) {
            // Remove the hashed password from the user object before returning it to the requester
            delete data.hashedPassword;
            callback(200, data)
          } else {
            callback(404); 
          }
        });
      } else {
        callback(403, { 'Error' : 'Missing required token in header, or token is invalid.' })
      }
    });
  } else {
    callback(400, { 'Error' : 'Missing required field'});
  }
}

// Users - put
// Required data : phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function(data, callback) {
  // Check for the required field
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

  // Check for the optional fields
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if the phone is invalid
  if(phone) {

    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    // verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', phone, function(err, userData) {
          if(!err && userData) {
            // Update the fields necessary
            if (firstName) {
              userData.firstName = firstName;
            }
            if (lastName) {
              userData.lastName = lastName;
            }
            if (password) {
              userData.hashedPassword = helpers.hash(password);
            }
            // Store the new updates
            _data.update('users', phone, userData, function(err) {
              if(!err) {
                callback(200);
              } else {
                console.log(err);
                callback(500, { 'Error' : 'Could not update the user' });
              }
            });
          } else {
            callback(400, { 'Error' : 'The specified user does not exist'});
          }
        });
      } else {
        callback(403, { 'Error' : 'Missing required token in header, or token is invalid.' })
      }
    });
  } else {
    callback(400, { 'Error' : 'Missing fields to update'});
  }


}

// Users - delete
// Required field : phone
// @TODO Only let an authenticated user delete their object. Don't let them delete anyone else's
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = function(data, callback) {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){

    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    // verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', phone, function(err, data) {
          if(!err && data) {
            _data.delete('users', phone, function(err) {
              if(!err) {
                callback(200);
              } else {
                callback(500, { 'Error' : 'Could not delete the specified user'});
              }
            });
          } else {
            callback(404, { 'Error' : 'Could not find the specified user'}); 
          }
        });
      } else {
        callback(403, { 'Error' : 'Missing required token in header, or token is invalid.' })
      }
    });
  }else {
    callback(400, { 'Error' : 'Missing required field'});
  }
}

// Tokens
handlers.tokens = function(data, callback) {
  const accetableMethods = ['post', 'get', 'put', 'delete'];
  if (accetableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data, callback) {
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
handlers._tokens.get = function(data, callback) {
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
handlers._tokens.put = function(data, callback) {
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
handlers._tokens.delete = function(data, callback) {
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
handlers._tokens.verifyToken = function(id, phone, callback) {
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
handlers.checks = function(data, callback) {
  const accetableMethods = ['post', 'get', 'put', 'delete'];

  if (accetableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the checks methods
handlers._checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// optional data: none

handlers._checks.post = function(data, callback) {
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

// Sample handler
handlers.ping = function(data, callback) {
  // Callbackk a http status code, and a payload object
  callback(200);
}

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
}

// Export the module
module.exports = handlers;