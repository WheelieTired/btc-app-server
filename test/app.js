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

// Under test
import { app } from '../lib/app';

// Modules to mock
import { nano_db } from '../lib/util/couch';

describe( 'Routes', function() {
  before( function() {
    this.request = request( app );
  } );
  describe( '/health', function() {
    describe( 'Check if the server is alive [GET]', function() {
      it( '+ Response 200', function( done ) {
        this.request.get( '/health' )
          .expect( 200, done );
      } );
    } );
  } );
} );

let token;
describe( 'Moderator user', function() {
  before( function() {
    this.request = request( app );
  } );
  describe( 'stubbing nano_db.auth(): moderator user', function() {
    before( function() {
      this.stub = sinon.stub( nano_db, 'auth' );
      this.stub.callsArgWith( 2, null, { roles: [ 'moderator' ] }, null );
    } );
    it( 'can log in as a moderator', function( done ) {
      this.request.post( '/authenticate' )
        .send( { email: 'moderator@example.com', password: 'moderator' } )
        .expect( function( res ) {
          token = res.body.auth_token;
        } )
        .end( done );
    } );
    it( '...and then access a moderator resource', /**function( done ) {
      this.request.get( '/flags' )
        .set( 'Authorization', `JWT ${token}` )
        .expect( function( res ) {
          assert.isArray( res.body );
        } )
        .end( done );
    } **/ );
    after( function() {
      this.stub.restore();
    } );
  } );
} );
