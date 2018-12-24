(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.PouchUpsert = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// this is essentially the "update sugar" function from daleharvey/pouchdb#1388
// the diffFun tells us what delta to apply to the doc.  it either returns
// the doc, or false if it doesn't need to do an update after all
function upsertInner(db, docId, diffFun) {
    if (typeof docId !== 'string') {
        return Promise.reject(new Error('doc id is required'));
    }
    return db.get(docId)["catch"](function (err) {
        /* istanbul ignore next */
        if (err.status !== 404) {
            throw err;
        }
        return {};
    }).then(function (doc) {
        // the user might change the _rev, so save it for posterity
        var docRev = doc._rev;
        var newDoc = diffFun(doc);
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
// exports.upsert = function(docId:PouchDB.Core.DocumentId, diffFun:UpsertDiffCallback<PouchDoc>, cb?:Function):Promise<UpsertResponse> {
var upsert = function (docId, diffFun, cb) {
    var self = this;
    var db = self;
    // let resp:UpsertResponse = await upsertInner(db, docId, diffFun);
    var promise = upsertInner(db, docId, diffFun);
    if (typeof cb !== 'function') {
        return promise;
    }
    promise.then(function (resp) {
        cb(null, resp);
    }, cb);
    // return resp;
};
exports.upsert = upsert;
// PouchDBWithUpsert.putIfNotExists = async function(docId:PouchDB.Core.DocumentId, doc:PouchDoc):Promise<UpsertResponse> {
// exports.putIfNotExists = async function(doc:PouchDoc):Promise<UpsertResponse> {
// exports.putIfNotExists = function(docId:PouchDB.Core.DocumentId, doc:PouchDoc, cb?:Function):Promise<UpsertResponse> {
var putIfNotExists = function (docId, doc, cb) {
    var self = this;
    var db = self;
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
    var diffFun = function (existingDoc) {
        if (existingDoc._rev) {
            return false; // do nothing
        }
        // return putDoc;
        return doc;
    };
    var promise = upsertInner(db, docId, diffFun);
    if (typeof cb !== 'function') {
        return promise;
    }
    promise.then(function (resp) {
        cb(null, resp);
    }, cb);
    // let resp:UpsertResponse = await upsertInner(db, id, diffFun);
    // return resp;
};
exports.putIfNotExists = putIfNotExists;

},{}]},{},[1])(1)
});
