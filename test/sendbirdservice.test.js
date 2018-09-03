const chai = require('chai');
const mute = require('mute');
const SendBirdService = require('../common/services/SendBirdService');

describe('SendBirdService', () => {
  it('Should generate signature without problem', (done)=> {
    SendBirdService.createSignature('some data to sig');
    done();
  });
});
