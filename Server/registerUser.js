'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Register and Enroll a user
 */

var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');

var path = require('path');
var util = require('util');
var os = require('os');

//
var fabric_client = new Fabric_Client();
var fabric_ca_client = null;
var admin_user = null;
var member_user = null;
var store_path = path.join(__dirname, 'hfc-key-store');
console.log(' Store path:' + store_path);

//----------------------------------------------------------
//to be passed as variables:
var ca_url = 'http://35.247.43.4:7054'; //GCP poc1 url, testing docker swarm
var admin_user_id = 'admin1-org1';
var user_id_to_register_and_enroll = 'user1-org1';
var user_affiliation = 'org1.department1';
var user_role = 'client';
var org_msp_id = 'Org1MSP';
//----------------------------------------------------------

// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
Fabric_Client.newDefaultKeyValueStore({
    path: store_path
}).then((state_store) => {
    // assign the store to the fabric client
    fabric_client.setStateStore(state_store);
    var crypto_suite = Fabric_Client.newCryptoSuite();
    // use the same location for the state store (where the users' certificate are kept)
    // and the crypto store (where the users' keys are kept)
    var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
    crypto_suite.setCryptoKeyStore(crypto_store);
    fabric_client.setCryptoSuite(crypto_suite);
    var tlsOptions = {
        trustedRoots: [],
        verify: false
    };
    // be sure to change the http to https when the CA is running TLS enabled
    fabric_ca_client = new Fabric_CA_Client(ca_url, null, '', crypto_suite);

    // first check to see if the admin is already enrolled
    return fabric_client.getUserContext(admin_user_id, true);
}).then((user_from_store) => {
    if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded admin from persistence');
        admin_user = user_from_store;
    } else {
        throw new Error('Failed to get admin.... run enrollAdmin.js');
    }

    // at this point we should have the admin user
    // first need to register the user with the CA server
    return fabric_ca_client.register({ enrollmentID: user_id_to_register_and_enroll, affiliation: user_affiliation, role: user_role }, admin_user);
}).then((secret) => {
    // next we need to enroll the user with CA server
    console.log('Successfully registered user: ' + user_id_to_register_and_enroll + ', secret:' + secret);

    return fabric_ca_client.enroll({ enrollmentID: user_id_to_register_and_enroll, enrollmentSecret: secret });
}).then((enrollment) => {
    console.log('Successfully enrolled member user: ' + user_id_to_register_and_enroll);
    return fabric_client.createUser(
        {
            username: user_id_to_register_and_enroll,
            mspid: org_msp_id,
            cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
        });
}).then((user) => {
    member_user = user;

    return fabric_client.setUserContext(member_user);
}).then((user) => {
    console.log('User was successfully registered and enrolled and is ready to interact with the fabric network');
    return user;
}).catch((err) => {
    console.error('Failed to register: ' + err);
    if (err.toString().indexOf('Authorization') > -1) {
        console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
            'Try again after deleting the contents of the store directory ' + store_path);
    }
});
