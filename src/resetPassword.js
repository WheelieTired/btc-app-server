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
import { mail } from './util/mailer';


const secret = config.get( 'token.secret' );
const issuer = config.get( 'token.iss' );
const expiresIn = config.get( 'token.exp' );

const algorithm = 'HS256';

// Sign a token with our server's secret. The token's payload will contain
// the user's email and assigned roles.
export function createToken( email, roles ) {
  return jwt.sign( { email, roles }, secret, { issuer, algorithm, expiresIn } );
}

// ## Verify email
// If the user recieves our token in their inbox, we know they control the
// email account.
export function updatePassword( req, res ) {
  const {password, verification} = req.body;
  if ( verification === undefined || verification === '' || password === undefined || password === '') {
    return res.status( 400 ).json( {
          'bad request': 'one or more of the attributes is empty'
    } );
  }

  const thankYouPage = fs.readFileSync( './staticPages/thankyou.html', 'utf8' );

  new UserRefCollection().fetch( {
    success: ( users, response, options ) => {
      const user = users.findWhere( { verification: verification } );
      if ( user ) {
        user.save( { verified: true, password: password, verification: createToken( user.emailAddress, [] )}, {
          force: true,
          success: ( model, response, options ) => res.send( template( thankYouPage )() ),
          error: ( model, response, options ) => res.status( 500 ).end()
        } );
        if ( user.validationError ) {
          res.status( 400 ).json( { error: user.validationError } );
        }
      } else {
        res.status( 400 ).json( { error: 'user does not exist or token is not valid' } );
             }
    },

    // Couldn't fetch user models -- not the user's problem
    error: ( users, response, options ) => res.status( 500 ).end()
  } );
}
