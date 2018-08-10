/**
 * 
 * Request handlers
 */

 // Dependencies
 import _data from './data';
 import helpers from './helpers';

// Define the handlers
const handlers = {};

// Ping handler
handlers.ping = (data, callback) => {
  callback(200);
};

// Not found handler
handlers.notFound = (data, callback) => {
callback(404);
};

// Users
handlers.users = (data, callback) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
handlers._users = {};


// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
//Optional data: none
handlers._users.post = (data, callback) => {
  // Check that all required fields are field out
  const payload = JSON.parse(data.payload);
  const firstName = typeof(payload.firstName) == 'string' && payload.firstName.trim().length > 0 ? payload.firstName.trim() : false;
  const lastName = typeof(payload.lastName) === 'string' && payload.lastName.trim().length > 0 ? payload.lastName.trim() : false;
  const phoneNumber = typeof(payload.phoneNumber) === 'string' && payload.phoneNumber.trim().length === 10 ? payload.phoneNumber.trim() : false;
  const password = typeof(payload.password) === 'string' && payload.password.trim().length > 0 ? payload.password.trim() : false;
  const tosAgreement = typeof(payload.tosAgreement) === 'boolean' && payload.tosAgreement === true ? true : false;
  if (firstName && lastName && phoneNumber && password && tosAgreement, tosAgreement) {
    _data.read('users', phoneNumber, (err, data) => {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);

        // Create the user object
        if (hashedPassword) {
          const userObject = {
            firstName,
            lastName,
            phoneNumber,
            hashedPassword,
            'tosAgreement' : true
          }
  
          // Store the user
          _data.create('users',phoneNumber,userObject, (err) => {
            if(!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {'Error': 'Could not create the new user'});
            }
          });
        } else {
          callback(500,{'Error' : `Could not hash the user\'s password.`});
        }
      } else {
        // User already exists
        callback(400,{'Error' : 'A user with that phone number already exists'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
};

// Users - get
// Required data: phone
// Optional data: none
// Only let authenticated users access their object. Don't let them access anyonbe elses
handlers._users.get = (data, callback) => {
  // Check that the phone number is valid
  let phoneNumber = data.queryStringObject.phoneNumber.trim();
  phoneNumber = typeof(data.queryStringObject.phoneNumber) === 'string' && phoneNumber.length === 10 ? phoneNumber : false

  if (phoneNumber) {
     //Lookup the user
    _data.read('users', phoneNumber, (err, data) => {
      if (!err && data){
        // Remove hashed password from the user before returing it to the requester
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// Users - put
// Required field : phoneNumber
// Optional data: firstName, lastName, password (at least one should be specified)
// Only let an authenticated user update their own object. Don't let them upate another users data
handlers._users.put = (data, callback) => {
  // check for the required field
  const payload = JSON.parse(data.payload);

  let phoneNumber = payload.phoneNumber.trim();
  phoneNumber = typeof(payload.phoneNumber) === 'string' && phoneNumber.length === 10 ? phoneNumber : false

  // Check for the optional fields
  const firstName = typeof(payload.firstName) == 'string' && payload.firstName.trim().length > 0 ? payload.firstName.trim() : false;
  const lastName = typeof(payload.lastName) === 'string' && payload.lastName.trim().length > 0 ? payload.lastName.trim() : false;
  const password = typeof(payload.password) === 'string' && payload.password.trim().length > 0 ? payload.password.trim() : false;

  // Error if the phonenNumber is invalid
  if (phoneNumber) {
    // Error is nothing is sent to update
    if (firstName || lastName || password) {
      // Lookup the user
      _data.read('users', phoneNumber, (err, userData) => {
        if (!err && userData) {
          // update the fields necessary
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
          _data.update('users', phoneNumber, userData, (err) => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {'Error': 'Could not update the user'});
            }
          });
        } else {
          callback(400, {'Error': 'The specified user does not exist'});
        }
      });
    } else {
      callback(400, {'Error': 'Missing fields to update'});
    }
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// Users - delete
// Required field: phoneNumber
// Only let authenticated user delete their object.
// Cleanup (data) any other data files associated with this user
handlers._users.delete = (data, callback) => {
  // Check that the phone number is valid
  let phoneNumber = data.queryStringObject.phoneNumber.trim();
  phoneNumber = typeof(data.queryStringObject.phoneNumber) === 'string' && phoneNumber.length === 10 ? phoneNumber : false

  if (phoneNumber) {
    //Lookup the user
    _data.read('users', phoneNumber, (err, data) => {
      if (!err && data){
        _data.delete('users', phoneNumber, (err) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, {'Error': 'Could not delete the specified user'});
          }
        });
      } else {
        callback(400, {'Error': 'Could not find the specified user'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

export default handlers;