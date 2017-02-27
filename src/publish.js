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

import { PointCollection, Photo } from 'btc-models';

import { isArray, isNumber, cloneDeep } from 'lodash';

// Endpoint to publish multiple point updates
//
// To do this, try to fetch the current models that are about to be updated.
// If there are addition, there will be fewer `existing` models than
// `incoming` models. Merge the incoming versions with the existing versions,
// replacing models with more recent updates. Then, save the models back to
// the database. TODO: investigate bulk save to the database.
export default function publish( req, res ) {
  const models = JSON.parse( req.body.models );
  if ( !isArray( models ) ) {
    res.status( 400 ).send( 'you can only publish an array of models' );
  }

  const existing = new PointCollection( [], {
    keys: models.map( doc => doc._id )
  } );
  existing.fetch().then( ( ) => {
    try {
      return new PointCollection( models, { deindex: true } );
    } catch ( err ) {
      res.status( 400 ).send( err );
    }
  } ).then( incoming => {
    existing.comparator = incoming.comparator = '_id';
    existing.sort();
    incoming.sort();

    return mergeLatest( existing.models, incoming.models );
  } ).then( merged => {
    return Promise.all(
      merged.map( model => {
        /* Updated the DB field with the user's id (aka their email) */
        model.set('updated_by', req.user.email);
        const promise = model.save();
        if ( isNumber( model.index ) && req.files[ model.index ] != null ) {
          const buffer = req.files[ model.index ].buffer;
          return promise.then(
            ( ) => {
            	const photo = new Photo();
            	photo.set('_id', model.id);
            	photo.set('updated_by', req.user.email);
            	const photoPromise = photo.save();

            	return photoPromise.then( ( ) => photo.attach(buffer, 'coverPhoto.jpg', 'image/jpg') );
            }
          );
        } else {
          return promise;
        }
      } )
    );
  } ).then(
    ( ) => res.status( 200 ).send( 'points saved successfully' )
  ).catch(
    err => res.status( 400 ).send( err )
  );
}

// The bicycle touring companion merge-on-publish algorithm:
//
// We always want to integrate the latest information about alerts and services,
// but the latest published point is not guaranteed to be up to date. In the
// app, time of update and time of publish are different, since users will not
// always have an internet connection.
//
// The algorithm assumes the `existing` and `incoming` arrays contain models
// sorted by _id in ascending order. We always throw away the `_rev` of
// new models---we let the server decide the first `_rev`. For updates, we
// apply the existing `_rev`, since it is needed to update the server db.
//
// The algorithm walks both arrays of models. When the _ids match, we use the
// newer model, then increment both array indices. When the _ids do not match,
// the incoming model must be new, since both lists are sorted. In this case,
// we use the incoming model and increment only the 'incoming' index.
export function mergeLatest( existing, incoming ) {
  const merged = [];

  let e = 0;
  let i = 0;
  while ( i < incoming.length ) {
    const im = incoming[ i ];
    im.unset( '_rev' );
    im.unset( '_attachments' );

    if ( e >= existing.length ) {
      merged.push( im );
    } else {
      const em = existing[ e ];

      if ( im.id == em.id ) {
        const id = new Date( im.get( 'updated_at' ) );
        const ed = new Date( em.get( 'updated_at' ) );

        const chosen = id >= ed ? im : em;

        const rev = em.get( '_rev' );
        chosen.set( '_rev', rev );

        merged.push( chosen );
        e++;
      } else {
        merged.push( im );
      }
    }

    i++;
  }

  return merged;
}
