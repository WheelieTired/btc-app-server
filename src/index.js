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

import http from 'http';
import https from 'https';
import fs from 'fs';

import { app } from './app';
import config from 'config';

const {protocol, domain, port, certificate, key} = config.get( 'server' );

if (protocol == "https") {
	let certificateFileContents = fs.readFileSync(certificate, 'utf8');
	let keyFileContents = fs.readFileSync(key, 'utf8');
	var options = {cert: certificateFileContents, key: keyFileContents};

	https.createServer(options, app).listen(port);
}
else {
	http.createServer(app).listen(port);
}

console.log( `Serving at ${protocol}://${domain}:${port}` );
