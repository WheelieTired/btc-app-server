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
import { PointCollection } from 'btc-models';

export default function flag( req, res ) {
  const {pointId} = req.body;

  if ( pointId === '' || pointId === undefined ) {
    return res.status( 400 ).json( {
      'bad request': 'You must provide a point id.'
    } );
  }

  // Check that the pointId is valid
	new PointCollection().fetch({
		success: ( points, response, options ) => {
			const point = points.findWhere( { _id: pointId } );
			if ( !point ) {
				// Point they are trying to comment on doesn't exist
				return res.status( 400 ).json( { error: "Specified point doesn't exist"} );
			}
			/*Add the user name to the array flagged_by*/
			var cur_flagged_by = point.get('flagged_by');

			if(cur_flagged_by.indexOf(req.user.email) > -1){
				return res.status( 400 ).json( { error: "You've already flagged this point"} );
			}

			cur_flagged_by.push(req.user.email);
			point.set('flagged_by', cur_flagged_by);
			point.set('updated_by', req.user.email);

			// Save comment into the database
			point.save( {}, {
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