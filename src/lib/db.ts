import { openDB, type DBSchema } from 'idb';
import type { PDFDocument, Folder } from '@/types/pdf';

interface PdfDB extends DBSchema {
  documents: { key: string; value: PDFDocument; indexes: { 'by-folder': string } };
  folders: { key: string; value: Folder };
}

const DB_NAME = 'pdf-manager';
const DB_VERSION = 3;

function getDB() {
  return openDB<PdfDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const docStore = db.createObjectStore('documents', { keyPath: 'id' });
        docStore.createIndex('by-folder', 'folderId');
        db.createObjectStore('folders', { keyPath: 'id' });
      }

      if (oldVersion < 3 && db.objectStoreNames.contains('tags')) {
        db.deleteObjectStore('tags');
      }
    },
  });
}

// Documents
export async function getAllDocuments() {
  const db = await getDB();
  return db.getAll('documents');
}

export async function getDocument(id: string) {
  const db = await getDB();
  return db.get('documents', id);
}

export async function addDocument(doc: PDFDocument) {
  const db = await getDB();
  await db.put('documents', doc);
}

export async function updateDocument(doc: PDFDocument) {
  const db = await getDB();
  await db.put('documents', doc);
}

export async function deleteDocument(id: string) {
  const db = await getDB();
  await db.delete('documents', id);
}

// Folders
export async function getAllFolders() {
  const db = await getDB();
  return db.getAll('folders');
}

export async function addFolder(folder: Folder) {
  const db = await getDB();
  await db.put('folders', folder);
}

export async function updateFolder(folder: Folder) {
  const db = await getDB();
  await db.put('folders', folder);
}

export async function deleteFolder(id: string) {
  const db = await getDB();
  // Move docs in this folder to root
  const docs = await db.getAllFromIndex('documents', 'by-folder', id);
  const tx = db.transaction('documents', 'readwrite');
  for (const doc of docs) {
    doc.folderId = null;
    await tx.store.put(doc);
  }
  await tx.done;
  await db.delete('folders', id);
}
