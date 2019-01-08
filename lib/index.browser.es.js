/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

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
var upsert = function (docId, diffFun) {
    return __awaiter(this, void 0, Promise, function () {
        var self, db, res, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    self = this;
                    db = self;
                    return [4 /*yield*/, upsertInner(db, docId, diffFun)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res];
                case 2:
                    err_1 = _a.sent();
                    throw err_1;
                case 3: return [2 /*return*/];
            }
        });
    });
};
// PouchDBWithUpsert.putIfNotExists = async function(docId:PouchDB.Core.DocumentId, doc:PouchDoc):Promise<UpsertResponse> {
// exports.putIfNotExists = async function(doc:PouchDoc):Promise<UpsertResponse> {
// exports.putIfNotExists = function(docId:PouchDB.Core.DocumentId, doc:PouchDoc, cb?:Function):Promise<UpsertResponse> {
var putIfNotExists = function (docId, doc) {
    return __awaiter(this, void 0, Promise, function () {
        var self, db, diffFun, res, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    self = this;
                    db = self;
                    if (typeof docId !== 'string') {
                        doc = docId;
                        docId = doc._id;
                    }
                    diffFun = function (existingDoc) {
                        if (existingDoc._rev) {
                            return false; // do nothing
                        }
                        // return putDoc;
                        return doc;
                    };
                    return [4 /*yield*/, upsertInner(db, docId, diffFun)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res];
                case 2:
                    err_2 = _a.sent();
                    throw err_2;
                case 3: return [2 /*return*/];
            }
        });
    });
};

export { upsert, putIfNotExists };
