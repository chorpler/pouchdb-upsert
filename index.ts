import * as PouchDB from 'pouchdb-core';

declare const window:any;

export interface PouchDocRequired extends Object {
  _id:string;
  _rev?:string;
  [propName:string]:any;
}
export type PDBContent = PouchDocRequired;
// export type PDBContent = PouchDB.Core.Document<any>;
// export type PDBContent = PouchDB.Core.Document<PouchDocRequired>;
// export type PouchDoc           = PDBContent;
export type PouchDoc           = any;

export type CancelUpsert = '' | 0 | false | null | undefined; // falsey values
// `Partial<Core.Document<Content>>` seems more useful than
// `{} | Core.Document<Content>` since there isn't an easy way to narrow
// `{} | Core.Document<Content>` to `Core.Document<Content>`.
export type UpsertDiffCallback<Content extends {}> = (doc: Partial<Content>) => Content & Partial<PouchDB.Core.IdMeta> | CancelUpsert;

interface UpsertResponse {
  id: PouchDB.Core.DocumentId;
  rev: PouchDB.Core.RevisionId;
  updated: boolean;
  ok?: boolean;
}
// this is essentially the "update sugar" function from daleharvey/pouchdb#1388
// the diffFun tells us what delta to apply to the doc.  it either returns
// the doc, or false if it doesn't need to do an update after all
function upsertInner(db:PouchDB.Database, docId:PouchDB.Core.DocumentId, diffFun:UpsertDiffCallback<PouchDoc>):Promise<UpsertResponse> {
  if (typeof docId !== 'string') {
    return Promise.reject(new Error('doc id is required'));
  }

  return db.get(docId).catch(function (err:PouchDB.Core.Error) {
    /* istanbul ignore next */
    if (err.status !== 404) {
      throw err;
    }
    return {};
  }).then(function (doc:PouchDoc) {
    // the user might change the _rev, so save it for posterity
    let docRev:string = doc._rev;
    let newDoc:PouchDoc = diffFun(doc);

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

function tryAndPut(db:PouchDB.Database, doc:PouchDoc, diffFun:UpsertDiffCallback<PouchDoc>):Promise<UpsertResponse> {
  return db.put(doc).then(function (res:PouchDB.Core.Response) {
    return {
      updated: true,
      rev: res.rev,
      id: doc._id
    };
  }, function (err:PouchDB.Core.Error) {
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
exports.upsert = async function(docId:PouchDB.Core.DocumentId, diffFun:UpsertDiffCallback<PouchDoc>):Promise<UpsertResponse> {
  let self:PouchDB.Database = this;
  let db:PouchDB.Database = self;
  // let promise:Promise<UpsertResponse> = upsertInner(db, docId, diffFun);
  let resp:UpsertResponse = await upsertInner(db, docId, diffFun);
  return resp;
};

// PouchDBWithUpsert.putIfNotExists = async function(docId:PouchDB.Core.DocumentId, doc:PouchDoc):Promise<UpsertResponse> {
// exports.putIfNotExists = async function(doc:PouchDoc):Promise<UpsertResponse> {
exports.putIfNotExists = async function(docId:PouchDB.Core.DocumentId, doc:PouchDoc):Promise<UpsertResponse> {
  let self:PouchDB.Database = this;
  let db:PouchDB.Database = self;
  let id:string, putDoc:PouchDoc;
  if(typeof doc === 'object') {
    putDoc = doc;
    id = docId;
  } else if(typeof docId === 'object') {
    putDoc = docId;
    id = putDoc._id;
  }
  if(!(putDoc && id)) {
    throw new Error('putIfNotExists() requires parameter be PouchDoc, or string and PouchDoc.');
  }
  // if(typeof docId !== 'string') {
  //   cb = doc;
  //   doc = docId;
  //   docId = doc._id;
  // }

  let diffFun:UpsertDiffCallback<PouchDoc> = function(existingDoc:PouchDoc) {
    if(existingDoc._rev) {
      return false; // do nothing
    }
    return putDoc;
  };
  let resp:UpsertResponse = await upsertInner(db, id, diffFun);
  return resp;
};

/* istanbul ignore next */
if (typeof window !== 'undefined' && (window as any).PouchDB) {
  (window as any).PouchDB.plugin(exports);
}

// export {PouchDBWithUpsert};
