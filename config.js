/**
 * Create and export configuration variables
 * 
 */

// Container for all the enviroments
const enviroments = {};

// Staging (default) enviroment
enviroments.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envName': 'staging',

};

// Production enviroment
enviroments.production = {
  'httpPort' : 5000,
  'httpsPort': 5001,
  'envName' : 'production'
};

// Determine which enviroment was passed as a command-line argument
const currentEnvironment = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

console.log(currentEnvironment);
// Check that the current enviroment is one of the enviroments above, if not, default to staging
const enviromentToExport = typeof enviroments[currentEnvironment] === 'object' ? enviroments[currentEnvironment] : enviroments.staging;

module.exports = enviromentToExport;