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
import config from 'config';

import { User, UserRefCollection } from 'btc-models';
import { mail } from './util/mailer';
import { createToken } from './authenticate';

// ## Apply Route
// Apply for a new Bicycle Touring Companion account
export function apply( req, res ) {
  // Filter req.body. We don't want the user to specify `roles`.
  const body = pick( req.body, [
    'email',
    'password',
    'first',
    'last'
  ] );

  const user = new User( body, { validate: true } );
  if ( user.validationError ) {
    return res.status( 400 ).json( { error: user.validationError } );
  }

  const verification = createToken( user.get( 'email' ), [] );

  // Save them into the database, but mark them as **not verified**
  user.save( { verification, verified: false }, {
    // Allow for backbone-pouch to set _id, _rev, etc.
    force: true,

    // Mail a confirmation message to the user
    success: ( user, response, options ) => {
      if ( config.get( 'mail.send' ) ) {
        mail( user, verification );
      } else {
        console.log( 'verification: ' + verification );
      }
      return res.status( 200 ).end();
    },

    error: ( user, response, options ) => {
      // We may get an error if the email is already registered.
      // Let's make it make more sense if we do.
      if ( response.error == 'conflict' ) {
        return res.status( 400 ).json( { error: 'There is already an account with that email address.' } );
      } else {
        return res.status( 400 ).json( { error: response.message } );
      }
    }
  } );
}

// ## Verify email
// If the user recieves our token in their inbox, we know they control the
// email account.
export function verify( req, res ) {
  req.checkParams( 'verification', 'verification token required' ).notEmpty();

  const errors = req.validationErrors();
  if ( errors ) {
    return res.status( 400 ).json( 'error', errors );
  }

  const {verification} = req.params;
  const thankYouPage = fs.readFileSync( './staticPages/thankyou.html', 'utf8' );

  new UserRefCollection().fetch( {
    // Look for an unverified user with a matching verification token. If that
    // user really exists, then mark them verified.
    success: ( users, response, options ) => {
      const user = users.findWhere( { verification, verified: false } );
      if ( user ) {
        user.unset( 'verification' );
        user.save( { verified: true }, {
          force: true,
          success: ( model, response, options ) => res.send( template( thankYouPage )() ),
          error: ( model, response, options ) => res.status( 500 ).end()
        } );
        if ( user.validationError ) {
          res.status( 400 ).json( { error: user.validationError } );
        }
      } else {
        res.status( 400 ).json( { error: 'you have not registered yet' } );
      }
    },

    // Couldn't fetch user models -- not the user's problem
    error: ( users, response, options ) => res.status( 500 ).end()
  } );
}
