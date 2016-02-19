import { pick } from 'underscore';

import { User, UserCollection } from './model/user';
import { mail } from './util/mailer';
import { connect } from './util/couch';
import { createToken } from './authenticate';

// Connect our User models to the database
connect( '_users', User, UserCollection );

// ## Apply Route
// Apply for a new Bicycle Touring Companion account
export function apply( req, res ) {
  // Filter req.body. We don't want the user to specify `roles`.
  const body = pick( req.body, [
    'email',
    'username',
    'first',
    'last',
    'password'
  ] );

  const user = new User( body, { validate: true } );
  if ( user.validationError ) {
    return res.status( 400 ).json( { error: user.validationError } );
  }

  const verification = createToken( user.get( 'email' ), [] );

  // Save them into the database, but mark them as **not verified**
  user.save( { verification, verified: false }, {
    success: ( user, response, options ) => {
      mail( user, verification );
      return res.status( 200 ).end();
    },

    // We may get an error if the email is already registered
    error: ( user, response, options ) => {
      return res.status( 400 ).json( {
        error: response.message,
        reason: response.reason
      } );
    }
  } );
  if ( user.validationError ) {
    return res.status( 400 ).json( { error: user.validationError } );
  }
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

  new UserCollection().fetch( {
    // Look for an unverified user with a matching verification token. If that
    // user really exists, then mark them verified.
    success: ( users, response, options ) => {
      const user = users.findWhere( { verification, verified: false } );
      if ( user ) {
        user.save( { verified: true }, {
          success: ( model, response, options ) => res.status( 200 ).end(),
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
