// Type definitions for pouchdb-upsert 7.0.1
// Project: https://github.com/pouchdb/upsert
// Definitions by: David Sargeant <https://github.com/chorpler>
//                 Keith D. Moore <https://github.com/keithdmoore>
//                 Andrew Mitchell <https://github.com/hotforfeature>
//                 Eddie Hsu <https://github.com/apolkingg8>
//                 John McLaughlin <https://github.com/zamb3zi>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.2

/// <reference types="pouchdb-core" />

declare namespace PouchDB {
  interface Database<Content extends {} = {}> {
    /**
     * Perform an upsert (update or insert) operation. Returns a Promise.
     *
     * @param docId - the _id of the document.
     * @param diffFun - function that takes the existing doc as input and returns an updated doc.
     * If this diffFunc returns falsey, then the update won't be performed (as an optimization).
     * If the document does not already exist, then {} will be the input to diffFunc.
     *
     */
    upsert<Model>(docId: Core.DocumentId, diffFun: UpsertDiffCallback<Content & Model>): Promise<UpsertResponse>;

    /**
     * Put a new document with the given docId, if it doesn't already exist. Returns a Promise.
     *
     * @param doc - the document to insert. Should contain an _id if docId is not specified
     * If the document already exists, then the Promise will just resolve immediately.
     */
    putIfNotExists<Model>(doc: Core.Document<Content & Model>): Promise<UpsertResponse>;

  }

  type CancelUpsert = '' | 0 | false | null | undefined; // falsey values
  // `Partial<Core.Document<Content>>` seems more useful than
  // `{} | Core.Document<Content>` since there isn't an easy way to narrow
  // `{} | Core.Document<Content>` to `Core.Document<Content>`.
  type UpsertDiffCallback<Content extends {}> = (doc: Partial<Core.Document<Content>>) => Content & Partial<Core.IdMeta> | CancelUpsert;

  interface UpsertResponse {
    id: Core.DocumentId;
    rev: Core.RevisionId;
    updated: boolean;
    ok?: boolean;
  }
}

declare module 'pouchdb-upsert' {
  const plugin: PouchDB.Plugin;
  export = plugin;
}