import * as PouchDB from 'pouchdb-core';
// this is essentially the "update sugar" function from daleharvey/pouchdb#1388
// the diffFun tells us what delta to apply to the doc.  it either returns
// the doc, or false if it doesn't need to do an update after all
function upsertInner(db, docId, diffFun) {
    if (typeof docId !== 'string') {
        return Promise.reject(new Error('doc id is required'));
    }
    return db.get(docId).catch(function (err) {
        /* istanbul ignore next */
        if (err.status !== 404) {
            throw err;
        }
        return {};
    }).then(function (doc) {
        // the user might change the _rev, so save it for posterity
        let docRev = doc._rev;
        let newDoc = diffFun(doc);
        if (!newDoc) {
            // if the diffFun returns falsy, we short-circuit as
            // an optimization
            return { updated: false, rev: docRev, id: docId };
        }
        // users aren't allowed to modify these values,
        // so reset them here
        newDoc._id = docId;
        newDoc._rev = docRev;
        return tryAndPut(db, newDoc, diffFun);
    });
}
function tryAndPut(db, doc, diffFun) {
    return db.put(doc).then(function (res) {
        return {
            updated: true,
            rev: res.rev,
            id: doc._id
        };
    }, function (err) {
        /* istanbul ignore next */
        if (err.status !== 409) {
            throw err;
        }
        return upsertInner(db, doc._id, diffFun);
    });
}
// declare namespace PouchDB {
//   interface Database<Content extends {} = {}> {
//     upsert
//   }
// }
// declare module PouchDB {
//   interface Database<Content extends {} = {}> {
//     upsert
//   }
// }
// let PouchDBWithUpsert:any = {};
// PouchDBWithUpsert.upsert = async function(docId:PouchDB.Core.DocumentId, diffFun:UpsertDiffCallback<PouchDoc>):Promise<UpsertResponse> {
exports.upsert = function (docId, diffFun, cb) {
    let self = this;
    let db = self;
    // let resp:UpsertResponse = await upsertInner(db, docId, diffFun);
    let promise = upsertInner(db, docId, diffFun);
    if (typeof cb !== 'function') {
        return promise;
    }
    promise.then((resp) => {
        cb(null, resp);
    }, cb);
    // return resp;
};
// PouchDBWithUpsert.putIfNotExists = async function(docId:PouchDB.Core.DocumentId, doc:PouchDoc):Promise<UpsertResponse> {
// exports.putIfNotExists = async function(doc:PouchDoc):Promise<UpsertResponse> {
exports.putIfNotExists = function (docId, doc, cb) {
    let self = this;
    let db = self;
    if (typeof docId !== 'string') {
        cb = doc;
        doc = docId;
        docId = doc._id;
    }
    // let id:string, putDoc:PouchDoc;
    // if(typeof doc === 'object') {
    //   putDoc = doc;
    //   id = docId;
    // } else if(typeof docId === 'object') {
    //   putDoc = docId;
    //   id = putDoc._id;
    // }
    // if(!(putDoc && id)) {
    //   throw new Error('putIfNotExists() requires parameter be PouchDoc, or string and PouchDoc.');
    // }
    // if(typeof docId !== 'string') {
    //   cb = doc;
    //   doc = docId;
    //   docId = doc._id;
    // }
    let diffFun = function (existingDoc) {
        if (existingDoc._rev) {
            return false; // do nothing
        }
        // return putDoc;
        return doc;
    };
    let promise = upsertInner(db, docId, diffFun);
    if (typeof cb !== 'function') {
        return promise;
    }
    promise.then((resp) => {
        cb(null, resp);
    }, cb);
    // let resp:UpsertResponse = await upsertInner(db, id, diffFun);
    // return resp;
};
/* istanbul ignore next */
if (typeof window !== 'undefined') {
    if (window.PouchDB) {
        window.PouchDB.plugin(exports);
    }
    else {
        window.PouchDB = PouchDB;
        window.PouchDB.plugin(exports);
    }
}
// export {PouchDBWithUpsert};
//# sourceMappingURL=index.js.map