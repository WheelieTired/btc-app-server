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
  //see if the information is getting there in the first place.
  const {pointId} = req.body;

  if ( pointId === '' || pointId === undefined ) {
    return res.status( 400 ).json( {
      'bad request': 'You must provide a point id.'
    } );
  }

  // Check that the pointId is valid

  new PointCollection().fetch( {
    success: ( points, response, options ) => {
      const point = points.findWhere( { _id: pointId } );
      if ( !point ) {
        // Point they are trying to comment on doesn't exist
        return res.status( 400 ).json( { error: 'Specified point doesn\'t exist' } );
      }
      //ELSE: there is a point and the following can take place...
      var cur_flagged_by = point.get( 'flagged_by' );

      //checking to see if user already flagged the point.
      for ( var i = 0, len = cur_flagged_by.length; i < len; i++ ) {
        if ( cur_flagged_by[ i ].user == req.user.email ) {
          //Let the user know they have already flagged this point.
          return res.status( 400 ).json( { error: 'You\'ve already flagged this point' } );
        }
      }
      //Add the user email and reason to the array flagged_by.
      cur_flagged_by.push( { user: req.user.email, reason: req.body.flagReason } );
      point.set( 'flagged_by', cur_flagged_by );
      point.set( 'updated_by', req.user.email );

      if ( cur_flagged_by.length >= 5 ) {
        //set the is_hidden boolean field to true.
        point.set( 'is_hidden', true );
      }
      if ( point.isValid() == false ) {
        return res.status( 400 ).json( { error: 'Enter a reason for flagging between 1 and 140 characters' } );
      }
      // Save comment into the database
      point.save( {}, {
        force: true,

        // Comment saved successfully
        success: ( comment, response, options ) => {
          return res.status( 200 ).end();
        },

        error: ( comment, response, options ) => {
          // Couldn't save comment
          return res.status( 400 ).json( { error: response.message } );
        }
      } );
    },

    // Couldn't fetch points
    error: ( users, response, options ) => res.status( 500 ).end()
  } );
}