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

/*global describe it before after*/

import request from 'supertest';
import sinon from 'sinon';
import { assert } from 'chai';

// Used to help test
import jwt from 'jsonwebtoken';
import config from 'config';
import _ from 'underscore';

const secret = config.get( 'token.secret' );

// Under test
import { app } from '../lib/app';
import { createToken } from '../lib/authenticate';

// Modules to mock
import { nano_db } from '../lib/util/couch';

describe( 'Routes', function() {
  before( function() {
    this.request = request( app );
  } );
  describe( '/authenticate', function() {
    describe( 'Retrieve an API token [POST]', function() {
      describe( '* Regular, unpriveledged user', function() {
        before( function() {
          this.stub = sinon.stub( nano_db, 'auth' );
          this.stub.callsArgWith( 2, null, { roles: [] }, null );
        } );
        after( function() {
          this.stub.restore();
        } );
        it( '+ Response 200', /**function( done ) {
          this.request.post( '/authenticate' )
            .send( { email: 'foo@example.com', password: 'foo' } )
            .expect( 200, done );
        } **/);
        it( '+ Response 200 (provides auth_token)', function( done ) {
          this.request.post( '/authenticate' )
            .send( { email: 'foo@example.com', password: 'foo' } )
            .expect( function( res ) {
              if ( !res.body.ok ) {
                return 'response was 200, but `ok` message not set';
              } else if ( !res.body.auth_token ) {
                return 'response was 200, but no `auth_token` provided';
              }
            } )
            .end( done );
        } );
        it( '+ Response 200 (valid jwt)', function( done ) {
          this.request.post( '/authenticate' )
            .send( { email: 'foo@example.com', password: 'foo' } )
            .expect( function( res ) {
              try {
                if ( !res.body.ok ) {
                  return 'response was 200, but `ok` message not set';
                } else if ( !res.body.auth_token ) {
                  return 'response was 200, but no `auth_token` provided';
                }
                const decoded = jwt.verify( res.body.auth_token, secret );
                if ( !_.isArray( decoded.roles ) ) {
                  return 'in the payload, roles should be an array';
                }
              } catch ( err ) {
                return err;
              }
            } )
            .end( done );
        } );
        it( '+ Response 200 (no roles)', function( done ) {
          this.request.post( '/authenticate' )
            .send( { email: 'foo@example.com', password: 'foo' } )
            .expect( function( res ) {
              if ( !res.body.ok ) {
                return 'response was 200, but `ok` message not set';
              } else if ( !res.body.auth_token ) {
                return 'response was 200, but no `auth_token` provided';
              }
              try {
                const decoded = jwt.verify( res.body.auth_token, secret );
                if ( !decoded.roles.length === 0 ) {
                  return 'a non moderator user should have no roles';
                }
              } catch ( err ) {
                return err;
              }
            } )
            .end( done );
        } );

      } );
      describe( '* User with no account', function() {
        before( function() {
          this.stub = sinon.stub( nano_db, 'auth' );
          this.stub.callsArgWith( 2, 'error', null, null );
        } );
        it( '+ Response 400', function( done ) {
          this.request.post( '/authenticate' )
            .send( { email: 'foo@example.com', password: 'bar' } )
            .expect( 400, done );
        } );
        after( function() {
          this.stub.restore();
        } );
      } );
      describe( '* All types of users', function() {
        it( '+ Response 400 (no email or password)', function( done ) {
          this.request.post( '/authenticate' )
            .expect( 400, done );
        } );
        it( '+ Response 400 (no email)', function( done ) {
          this.request.post( '/authenticate' )
            .send( { email: '' } )
            .expect( 400, done );
        } );
        it( '+ Response 400 (no password)', function( done ) {
          this.request.post( '/authenticate' )
            .send( { password: '' } )
            .expect( 400, done );
        } );
      } );
    } );
  } );
} );

describe( 'createToken()', function() {
  it( 'produces a valid jwt with no roles', function( done ) {
    const token = createToken( 'foo@example.com', [] );
    jwt.verify( token, secret, function( err, decoded ) {
      if ( err ) {
        done( err );
      } else {
        assert.deepPropertyVal( decoded, 'email', 'foo@example.com' );
        assert.deepProperty( decoded, 'roles' );
        assert.isArray( decoded.roles );
        assert.lengthOf( decoded.roles, 0 );
        done();
      }
    } );
  } );
  it( 'produces a valid jwt with a moderator role', function( done ) {
    const token = createToken( 'foo@example.com', [ 'moderator' ] );
    jwt.verify( token, secret, function( err, decoded ) {
      if ( err ) {
        done( err );
      } else {
        assert.deepPropertyVal( decoded, 'email', 'foo@example.com' );
        assert.deepProperty( decoded, 'roles' );
        assert.isArray( decoded.roles );
        assert.include( decoded.roles, 'moderator' );
        done();
      }
    } );
  } );
} );
