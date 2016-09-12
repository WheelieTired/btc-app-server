# App server for the Bicycle Touring Companion

The server for the bicycle touring companion handles user interactions that must be handled online. Right now, the server lets users log in and publish alerts and services. While users may replicate changes from the master database to their devices, they cannot write back to the database directly. Changes must be published to the server so we can validate what goes into the official record. 
The server is a Node.js application that runs the Express.js server-side framework. It runs in a Windows Server 2012 cloud instance on AWS. 


[![Build Status](https://travis-ci.org/bikelomatic-complexity/btc-app-server.svg?branch=master)](https://travis-ci.org/bikelomatic-complexity/btc-app-server)
[![Coverage Status](https://coveralls.io/repos/github/bikelomatic-complexity/btc-app-server/badge.svg?branch=coveralls)](https://coveralls.io/github/bikelomatic-complexity/btc-app-server?branch=master)
[![Dependency Status](http://david-dm.org/bikelomatic-complexity/btc-app-server.svg)](http://david-dm.org/bikelomatic-complexity/btc-app-server)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](http://www.gnu.org/licenses/agpl-3.0)

# Developing Locally
 - Install CouchDB
 - Configure CouchDB with the couchdb-config repo to allow for Cross-origin resource sharing: https://github.com/Tour-de-Force/couchdb-config
 - Run CouchDB
  - it should give you an option to automatically start on windows
  - on linux, depending on your install, this may be the following command
  `sudo -u couchdb /usr/bin/couchdb`
  - this may generate errors, but couchdb should still be running
 - `npm install && npm start` to get a server loaded on localhost:8080
 - go to `localhost:5984/_utils/` where CouchDB should be running (if you
 selected to launch it after install)
  - go to the bottom right where a small dialogue box mentions that everyone is
  an admin. Make sure to change this before (click the "fix this" link) and
  follow those steps.
 - Look at the apiary (`apiary.apib`) for more information.
  - You can use postman to make the requests at `localhost:8080`

# Running tests locally
To run tests on you machine, it is recommended that you set the node environment
to be set to `test`. This can be done by running the following in windows:
```
set NODE_ENV=test
```  
or if you are running linux, by running:  
```
export NODE_ENV=test
```

# Sending Emails
One of the things you can do with btc-app-server is send emails upon registering
a new user! To have the email send, you will need to set the configuration as it
is labeled in `config/custom-environment.yml`.  

Any of the configurations in there can be changed. Simply set your environment
variables on your local machine to what you want them to be. For example, to
send emails on a windows device, you would run `set SERVER_SEND_MAIL=true`.

# Images not loading in email
If you are developing locally, it could be the case that your images will get
redirected and loaded through a proxy after being cached. If when testing the
emails being sent, they do not appear to load correctly, try an email server
that does not use a proxy (e.g. https://mailinator.com/).

# Updating the AWS Server
Travis CI is set up to push new versions of btc-app-server when releases are 
made. Simply use the github releases feature to create a new release (make
sure it includes a new version number).
