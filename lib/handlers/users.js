// Users
const users = function(data, callback) {
  const accetableMethods = ['post', 'get', 'put', 'delete'];
  if (accetableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
const _users = {};

// Users - post
// Required data: firstName, lastName, phone, password, toAgreement
_users.post = async function(data) {
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
_users.get = function(data, callback) {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){

    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    // verify that the given token is valid for the phone number
    _tokens.verifyToken(token, phone, function(tokenIsValid) {
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
_users.put = function(data, callback) {
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
    _tokens.verifyToken(token, phone, function(tokenIsValid) {
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
_users.delete = function(data, callback) {
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

export { 
  users
}