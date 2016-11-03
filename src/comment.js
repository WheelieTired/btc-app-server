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

import { Comment, PointCollection } from 'btc-models';

export default function comment( req, res ) {
	// Separate pointId
	const pointId = req.body.pointId;
	// Filter req.body to only the things which should be sent to the model.
	const body = pick( req.body, [
		'text',
		'rating',
	]);

	if (!pointId) {
		// Request didn't specify on which point to comment
		return res.status( 400 ).json( { error: "must provide the pointId for this comment" } );
	}

	// Check that the pointId is valid
	new PointCollection().fetch({
		success: ( points, response, options ) => {
			const point = points.findWhere( { _id: pointId } );
			if ( !point ) {
				// Point they are trying to comment on doesn't exist
				return res.status( 400 ).json( { error: "specified point doesn't exist"} );
			}

			const comment = new Comment( body, { validate: true,  pointId: pointId} );
			if ( comment.validationError ) {
				// Comment was invalid according to the model
				return res.status( 400 ).json( { error: comment.validationError } );
			}

			// Save comment into the database
			comment.save( {}, {
				force: true,

				success: ( comment, response, options ) => {
					// Comment saved successfully
					return res.status( 200 ).end();
				},

				error: ( comment, response, options ) => {
					// Couldn't save comment
					return res.status( 400 ).json( { error: response.message } );
				}
			});
		},

		// Couldn't fetch points
		error: ( users, response, options ) => res.status( 500 ).end()
	});
}
