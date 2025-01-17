define(['pouchdb', 'config'], function(PouchDB, config) {

  var db = new PouchDB(config.db.public);

  return {
    middleware: {
      save: function(req, event, next) {
        var document = req.document || {
          type: "fiddle"
        };
        db.put(document, generateShurl(8))
          .then(function (result) {
            req.params.fiddle = result.id;
            req.revision = result.rev;
            req.params.attachment = "0";
            next();
          });
      },
      extract: function(req, event, next) {
        req.params.attachment = "" + (currentAttachment(req.document._attachments)+1);
        req.params.fiddle = req.document._id;
        req.revision = req.document._rev;
        next();
      },
      update: function(req, event, next) {
        var attachment = new Blob([req.source], {type: 'text/plain'});
        db.putAttachment(req.params.fiddle, req.params.attachment + '.gv', req.revision, attachment, 'text/plain')
          .then(function () {
            next();
          });
      },
      load: function(req, event, next) {
        db.get(req.params.fiddle).then(function(document) {
          req.document = document;
          if (!req.params.attachment) {
            req.params.attachment = "" + currentAttachment(document._attachments);
          }
          next();
        });
      },
      source: function(req, event, next) {
        db.getAttachment(req.document._id, req.params.attachment + '.gv').then(function (blob) {
          var reader = new FileReader();
          reader.addEventListener("loadend", function() {
            req.source = this.result;
            next();
          });
          reader.readAsText(blob);
        });
      }
    }
  };

  function currentAttachment(attachments) {
    var max = 0, current;
    for (var attachment in attachments) {
      current = parseInt(attachment.split(".")[0]);
      max = current > max ? current : max;
    }
    return max;
  }

  function generateShurl(length) {
    var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var shurl = '';
    for (var i=0; i<length; i++) {
      shurl += tab.charAt(Math.floor(Math.random() * tab.length));
    }
    return shurl;
  }
});