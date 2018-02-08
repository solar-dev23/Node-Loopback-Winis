'use strict';

var md5 = require('md5');

module.exports = function (Deposit) {
    Deposit.tapjoy = async function (id, snuid, currency, mac_address, display_multiplier, verifier) {
        const app = Deposit.app;
        let secret_key = app.get('tapjoyKey');
        if (!verifier) {
            // [snuid, currency, mac_address, display_multiplier]
            var error = new Error('Parameter secret_key not present. You are probably not a TapJoy server.');
            error.status = 403;
            throw error;
        } else {
            // [snuid, currency, mac_address, display_multiplier] + [id, verifier]˝
            if (md5(`${id}:${snuid}:${currency}:${secret_key}`) == verifier) {
                const user = await app.models.user.findById(snuid);
                if (!user) {
                    var error = new Error("User does not exist.");
                    error.status = 403;
                    throw error;
                } else {
                    let oldWinis = user.winis;
                    let newWinis = (await user.grantWinis(parseInt(currency * display_multiplier))).winis;
                    if (newWinis == (oldWinis + parseInt(currency * display_multiplier))) {
                        let newDeposit = await Deposit.create({
                            externalId: id,
                            userId: snuid,
                            method: 'tapjoy',
                            amount: currency
                        });
                        return { result: true, depositId: newDeposit.id };
                    } else {
                        var error = new Error("Error while granting winis.");
                        error.status = 403;
                        throw error;
                    }
                }
            } else {
                var error = new Error('Request not verified. You are probably not a TapJoy server.');
                error.status = 403;
                throw error;
            }
        }
    }
};
