# limited

> Compose `$aggregate` MongoDB queries for Mongoose as if `$push` had a `$limit` operator.

Fetching the "top N commits on each repository with one of these ids" is a hard task due to MongoDB's limitations on `$aggregate`, specifically the inability to `$limit` on a `$push` operator. `limited` makes this easier for you.

# Install

```shell
npm install limited --save
```

# `limited(options, done)`

Configuration `options` are detailed below.

Property | Description                                                                | Example
---------|----------------------------------------------------------------------------|----------
`model`  | The `mongoose` model or raw `mongodb` collection you want to operate on    | `Commit`
`field`  | The field you want to group by                                             | `'repo'`
`query`  | Optional filter so that the aggregate doesn't run on the entire collection | `{ repo: { $in: repoIds } }`
`sort`   | Optional sort expression as an object                                      | `{ created: -1 }`
`limit`  | Number of documents do you want to retrieve from each match                | 5

A single _(albeit complex)_ query will be issued against the database and you'll get back a list of `model` documents that match your `query` requirements, grouped by at most `limit` documents per `field`, and sorted by `sort`.

```js
var _ = require('lodash');
var limited = require('limited');
var models = require('./models');

function getLastCommitInRepositories (ids, done) {
  var options = {
    model: models.Commit,
    field: 'repo',
    query: { repo : { $in: ids } },
    limit: 5,
    sort: { created: -1 }
  };
  limited(options, find);

  function find (err, result) {
    if (err) {
      done(err); return;
    }

    models.Commit
      .find({ _id: { $in: _.flatten(result, 'documents') } })
      .lean()
      .exec(done);
  }
}
```

The second query isn't executed on your behalf. It's up to you to decide how you want to deal with the document ids you get back from `limited`.

# License

MIT
