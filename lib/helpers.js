/**
 * Helpers for various tasks
 * 
 */

// Dependencies
import crypto from 'crypto';
import config from './../config'; 


// Create a SHA256 hash
const hash = function(str) {
  if(typeof(str) === 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Parse a JSON string to an object in all cases, without throwing
const parseJsonToObject = function(str) {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch(e) {
    return {};
  }
};

// Create a string of random alphanumeric characters, of a given length
const createRandomString = function(strLength) {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    // Define all the possible characters that could go into a string
    const possibleCharacters = 'abcdefghijklmnopqestuvwxyz0123456789';

    // Start the final string
    let str = '';
    for(i= 1; i <= strLength; i++) {
      // Get a random character from the possibleCharacter string
      let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      // Append this character to the final string
      str += randomCharacter
    }

    // Return the final string
    return str;
  } else {
    return false;
  }
};

export {
  hash,
  parseJsonToObject,
  createRandomString,
};