/* btc-app-server -- Server for the Bicycle Touring Companion
 * Copyright © 2016 Adventure Cycling Association
 *
 * This file is part of btc-app-server.
 *
 * btc-app-server is free software: you can redistribute it and/or modify
 * it under the terms of the Affero GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * btc-app-server is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * Affero GNU General Public License for more details.
 *
 * You should have received a copy of the Affero GNU General Public License
 * along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
 */

import { pick } from 'underscore';
import { template } from 'underscore';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import config from 'config';

import { User, UserRefCollection } from 'btc-models';
import { forgotPassword } from './util/mailer';


const secret = config.get( 'token.secret' );
const issuer = config.get( 'token.iss' );
const expiresIn = '60m';

const algorithm = 'HS256';

// Sign a token with our server's secret. The token's payload will contain
// the user's email and assigned roles.
export function createToken( email, roles ) {
  return jwt.sign( { email, roles }, secret, { issuer, algorithm, expiresIn } );
}

export function checkEmail( req, res ) {
  const {email} = req.body;
  const emailAddress = email;
  if ( emailAddress === '' || emailAddress === undefined ) {
    return res.status( 400 ).json( {
      'bad request': 'You must supply a valid email.'
    } );
  }

  new UserRefCollection().fetch( {
    success: ( users, response, options ) => {
      const user = users.findWhere( { email: emailAddress } );
      if ( user == undefined ) {
        return res.status( 400 ).json( {
          'bad request': 'User was not found in the database.'
        } );
      }
      const verification = createToken( emailAddress, [] );

      // Save new token into the database
      user.save( { verification }, {
        // Allow for backbone-pouch to set _id, _rev, etc.
        force: true,

        // Mail a confirmation message to the user
        success: ( user, response, options ) => {
          if ( config.get( 'mail.send' ) ) {
            forgotPassword( user, verification );
          } else {
            console.log( 'verification: ' + verification );
          }
        //return res.status( 200 ).end();
        },

        error: ( user, response, options ) => {
          return res.status( 400 ).json( { error: response.message } );
        }
      } );
    },
    // Couldn't fetch user models -- not the user's problem
    error: ( users, response, options ) => res.status( 500 ).end()
  } );
  return res.status( 200 ).json( {
    ok: 'an email has been sent',
  //auth_token: createToken( email, body.roles )
  } );
}
