# Seemly

A dashboard that ranks your site's Google Pagespeed Insight values.

## Getting Started

These instructions will help you set up Seemly.

### Prerequisites

[Docker](https://store.docker.com/search?offering=community&type=edition)

### Installing

1. Acquire an SSL certificate. If you are using a self-signed certificate run the following commands to create a certificate and make your local machine trust that certificate:

		openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout web.key -out web.crt
        sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain web.crt

2. Place `web.crt` and `web.key` SSL certificate files in `/`.

3. Copy `/app/config.json.example` to `/app/config.json`

4. In `app/config.json` define Couchbase authentication information.

5. In `app/config.json` add your array of sites you wish to show on the dashboard. You can change the list of sites in this file at any time.

6. Bring up just the Couchbase container, running this command will return a container ID to use in Step 8:

		docker run -d -v $PWD/persistence:/opt/couchbase/var -p 8091:8091 couchbase:community-4.5.0

7. Seed the Couchbase database with the authentication information you specified in `/app/config.json` either by visting http://localhost:8091 or running these `curl` commands, replacing everything in {} with values from `/app/config.json`:

        curl -v -X POST http://localhost:8091/pools/default -d memoryQuota=512 -d indexMemoryQuota=512
        curl -v -X POST http://localhost:8091/node/controller/setupServices -d services=kv%2cn1ql%2Cindex
        curl -v http://localhost:8091/settings/web -d port=8091 -d username={admin} -d password={adminPassword}
        curl -v -u {admin}:{adminPassword} -X POST http://localhost:8091/pools/default/buckets -d name={bucket} -d bucketType=couchbase -d ramQuotaMB=256 -d authType=sasl -d saslPassword={bucketPassword}

8. Shut down the Couchbase container:

		docker stop [container-id]

## Usage

1. Run `docker-compose up`.

2. Visit your Seemly install at [https://localhost](https://localhost).

## Running commands

While Seemly is running, you can issue commands to the application

		docker exec seemly_app_1 ./app.js [command]

Where [command] is one of the following:

* audit-sites
* delete-sites

## Authors

* **Derek McBurney** - [dmcb](https://github.com/dmcb)
