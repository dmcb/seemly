# Seemly

A dashboard that ranks your site's Google Pagespeed Insight values. 

## Getting Started

These instructions will help you set up Seemly.

### Prerequisites

[Docker](https://store.docker.com/search?offering=community&type=edition)

### Installing

1. Place `web.crt` and `web.key` SSL certificate files in /

2. If you are using a self-signed SSL certificate, make your local machine trust that certificate. Here are instructions on MacOS:

        sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain web.crt

3. Copy `/app/config.json.default` to `/app/config.json` and define Couchbase authentication information in `/app/config.json`

4. Run `docker-compose up`

5. Set up Couchbase with the authentication information you specified in `/app/config.json` either by visting http://localhost:8091 or running these `curl` commands, replacing everything in {} with values from `/app/config.json`:

        curl -v -X POST http://localhost:8091/pools/default -d memoryQuota=512 -d indexMemoryQuota=512
        curl -v -X POST http://localhost:8091/node/controller/setupServices -d services=kv%2cn1ql%2Cindex
        curl -v http://localhost:8091/settings/web -d port=8091 -d username={admin} -d password={adminPassword}
        curl -v -u {admin}:{adminPassword} -X POST http://localhost:8091/pools/default/buckets -d name={bucket} -d bucketType=couchbase -d ramQuotaMB=256 -d authType=sasl -d saslPassword={bucketPassword}

## Usage

[Visit Seemly](https://localhost)

## Authors

* **Derek McBurney** - [dmcb](https://github.com/dmcb)
