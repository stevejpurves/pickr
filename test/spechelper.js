var chai = require('chai'),
    sinonChai = require("sinon-chai");
 
global.expect = chai.expect;
var sinon = require('sinon');
chai.use(sinonChai);