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

/*global process, __dirname*/
import './util/couch';

import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import validator from 'express-validator';
import multer from 'multer';

import passport from './util/passport'; // passport with customizations

import cors from './cors';
import * as register from './register';
import * as authenticate from './authenticate';
import * as flag from './flag';
import * as publish from './publish';

// Allows any valid tokens
passport.use( 'user', authenticate.userStrategy );

// Allows tokens that have a moderator role
passport.use( 'moderator', authenticate.moderatorStrategy );

export const app = express();

app.set( 'json spaces', 2 );

if ( process.env.NODE_ENV === 'development' ) {
  app.use( morgan( 'dev' ) );
}
app.use( bodyParser.json() );
app.use( validator() );
app.use( passport.initialize() );
app.use( cors );

app.post( '/register', register.apply );
app.get( '/register/:verification', register.verify );

app.post( '/authenticate', authenticate.default );
app.get( '/flags', passport.authenticate( 'moderator' ), flag.list );

const storage = multer.memoryStorage();
const upload = multer( { storage } );
app.post( '/publish', passport.authenticate( 'user' ), upload.array( 'covers' ), publish.default );

// Used by our Elastic Load Balacers
app.get( '/health', ( req, res ) => res.status( 200 ).send( 'ok' ) );

// Host the static content of staticPages
app.use( express.static( __dirname + '/../staticPages' ) );
