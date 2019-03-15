var _ = require('lodash'),
    moment = require('moment'),
    helper = require('../lib/helper');

describe('schedule builder', function() {
  beforeEach(function() {
    this.details = {
      name: 'name',
      collection: 'collection',
      id: 'recordId',
      after: 'date',
      query: 'query',
      data: { my: 'data' }
    };
  });

  it('should return doc to insert', function() {
    var doc = helper.buildSchedule(this.details).doc;
    doc.should.have.properties({
      name: 'name',
      status: 'ready',
      conditions: { after: 'date' },
      storage: { query: 'query', collection: 'collection', id: 'recordId' },
      data: { my: 'data' },
      options: { emitPerDoc: false }
    });
  });

  it.skip('should return query for updates', function() {
    var query = helper.buildSchedule(this.details).query;
    query.should.have.properties({
      name: 'name',
      'storage.collection' : 'collection',
      'storage.id': 'recordId'
    });
  });

// Remove this test ?
  it.skip('should default to empty conditions', function() {
    var doc = helper.buildSchedule({}).doc;
    doc.conditions.should.eql({});
  });

// Remove this test ?
  describe.skip('with queryfields', function() {
    it('should translate the fields', function() {
      this.details.options = {
        queryFields: 'name collection id query after data'
      };
      var query = helper.buildSchedule(this.details).query;
      _.keys(query).should.eql(['event', 'storage.collection',
        'storage.id', 'storage.query', 'conditions.after', 'data']);
    });

    it('should pick the query fields from the doc', function() {
      this.details.options = {
        queryFields: 'name collection query data'
      };
      var query = helper.buildSchedule(this.details).query;
      query.should.eql({
        name: 'name',
        'storage.collection' : 'collection',
        'storage.query': 'query',
        'data': {my: 'data'}
      });
    });
  });

  describe('with cron property', function() {
    beforeEach(function() {
      this.cronDetails = { cron: '0 0 23 * * *', ...this.details };
    });

    it('should include cron string in doc', function() {
      var doc = helper.buildSchedule(this.cronDetails).doc;
      doc.cron.should.eql('0 0 23 * * *');
    });

    it('should calculate next tick', function() {
      var doc = helper.buildSchedule(this.cronDetails).doc,
          nextTick = moment().hours(23).startOf('hour').toDate(),
          sanitizedDate = moment(doc.conditions.after).startOf('second');

      sanitizedDate.toDate().should.eql(nextTick);
    });
  });
});

describe('event builder', function() {
  beforeEach(function() {
    this.doc = { conditions: {}, storage: {} };
  });

  it('extends query with id from storage', function() {
    this.doc.storage.id = 'HI!!!';
    var event = helper.buildEvent(this.doc);
    event.conditions.query._id.should.eql('HI!!!');
  });

  it('returns additional data', function() {
    this.doc.data = 'OMG!';
    var event = helper.buildEvent(this.doc);
    event.data.should.eql('OMG!');
  });
});

describe('should exit', function() {
  it('should return true if an error is passed', function() {
    helper.shouldExit(new Error()).should.eql(true);
  });

  it('should return true if last error object has an err string', function() {
    helper.shouldExit(null, {lastErrorObject: {err: 'hai'}}).should.eql(true);
  });

  it('should return false if last error object has no err string', function() {
    helper.shouldExit(null, {lastErrorObject: {}}).should.eql(false);
  });

  it('should return false if there is no lastErrorObject', function() {
    helper.shouldExit(null, {}).should.eql(false);
  });
});

describe('error builder', function() {
  it('should return error', function() {
    var err = new Error();
    helper.buildError(err).should.equal(err);
  });

  it('should wrap err string in error', function() {
    var result = {lastErrorObject: { err: 'sad times' }};
    helper.buildError(null, result).message.should.equal('sad times');
  });
});