const chai = require('chai');
const SendBirdService = require('../common/services/SendBirdService');
const sendbirdWebhookData = require('./fixtures/sendbirdwebhook.json');

const { expect } = chai;

describe('SendBirdService', () => {
  it('should create valid x-signature', done => {
    const signature = SendBirdService.createSignature(
      JSON.stringify(sendbirdWebhookData)
    );
    expect(signature).to.be.equal(
      '9a5b865eacc5292c78622b307955d6d4b5c6b488e0f53d32b5d5b2c27f22894c'
    );
    done();
  });
});
