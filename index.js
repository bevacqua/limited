'use strict';

function fill (length) {
  return Array.apply(null, { length: length }).map(Number.call, Number);
}

function limited (o, done) {
  var pipe = [];

  if (o.limit === 0) {
    done(null, []); return;
  }

  if (o.query) {
    pipe.push({ $match: o.query });
  }
  if (o.sort) {
    pipe.push({ $sort: o.sort });
  }

  pipe.push({
    $group: {
      _id: '$' + o.field,
      f0: { $first: '$_id' },
      d: { $push: '$_id' }
    }
  });

  for (var i = 0; i < o.limit - 1; i++) {
    pipe.push({ $unwind: '$d' });
    pipe.push(projection(i));
    pipe.push({ $sort: { seen: 1 } });
    pipe.push(grouping(i));
  }

  pipe.push(projection(i, { $project: { p: { $const: fill(i + 1) } } }));
  pipe.push({ $unwind: '$p' });
  pipe.push(unroll(i));
  pipe.push({ $unwind: '$d' });
  pipe.push({ $match: { d: { $ne: false } } });
  pipe.push({ $group: { _id: '$_id', documents: { $push: '$d' } } });

  o.model.aggregate(pipe).exec(done);
}

function projection (edge, defaults) {
  var base = defaults || {
    $project: { d: 1, seen: { $eq: ['$f' + edge, '$d'] } }
  };
  var p = base.$project;
  for (var i = 0; i <= edge; i++) {
    p['f' + i] = 1;
  }
  return base;
}

function grouping (edge) {
  var base = {
    $group: {
      _id: '$_id', d: { $push: { $cond: [{ $not: '$seen' }, '$d', false] } }
    }
  };
  var g = base.$group;
  for (var i = 0; i <= edge; i++) {
    g['f' + i] = { $first: '$' + 'f' + i };
  }
  g['f' + i] = { $first: '$d' };
  return base;
}

function unroll (edge) {
  var base = { $group: { _id: '$_id', d: { $push: {} } } };
  var root = base.$group.d.$push;

  for (var i = 0; i <= edge; i++) {
    root.$cond = [{ $eq: ['$p', i] }, '$f' + i, i === edge ? false : {}];
    root = root.$cond[2];
  }

  return base;
}

module.exports = limited;
