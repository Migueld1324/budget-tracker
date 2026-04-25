import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CategoryLists, TransactionType } from '../types';

const DEFAULT_CATEGORIES: CategoryLists = {
  Ingreso: [],
  Gasto: [],
  Transferencia: [],
};

function configDocRef(userId: string) {
  return doc(db, 'users', userId, 'categories', 'config');
}

function transactionsRef(userId: string) {
  return collection(db, 'users', userId, 'transactions');
}

export async function getAll(userId: string): Promise<CategoryLists> {
  const snap = await getDoc(configDocRef(userId));
  if (!snap.exists()) {
    return { ...DEFAULT_CATEGORIES };
  }
  const data = snap.data();
  return {
    Ingreso: data.Ingreso ?? [],
    Gasto: data.Gasto ?? [],
    Transferencia: data.Transferencia ?? [],
  };
}

export async function addCategory(
  userId: string,
  type: TransactionType,
  name: string
): Promise<void> {
  const ref = configDocRef(userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      ...DEFAULT_CATEGORIES,
      [type]: arrayUnion(name),
    });
  } else {
    await updateDoc(ref, {
      [type]: arrayUnion(name),
    });
  }
}

export async function deleteCategory(
  userId: string,
  type: TransactionType,
  name: string
): Promise<void> {
  await updateDoc(configDocRef(userId), {
    [type]: arrayRemove(name),
  });
}

export async function hasTransactions(
  userId: string,
  type: TransactionType,
  name: string
): Promise<boolean> {
  const q = query(
    transactionsRef(userId),
    where('type', '==', type),
    where('category', '==', name),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}
