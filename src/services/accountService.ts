import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { isTDC } from '../utils/validators';
import type { Account, AccountInput } from '../types';

function accountsRef(userId: string) {
  return collection(db, 'users', userId, 'accounts');
}

function transactionsRef(userId: string) {
  return collection(db, 'users', userId, 'transactions');
}

export async function getAll(userId: string): Promise<Account[]> {
  const snapshot = await getDocs(accountsRef(userId));
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId,
      name: data.name,
      initialBalance: data.initialBalance,
      isTDC: isTDC(data.name),
      createdAt: data.createdAt,
    } as Account;
  });
}

export async function create(
  userId: string,
  data: AccountInput
): Promise<string> {
  const docRef = await addDoc(accountsRef(userId), {
    name: data.name,
    initialBalance: data.initialBalance,
    userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function update(
  userId: string,
  id: string,
  data: Partial<AccountInput>
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'accounts', id);
  await updateDoc(docRef, { ...data });
}

export async function remove(
  userId: string,
  id: string
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'accounts', id);
  await deleteDoc(docRef);
}

export async function hasTransactions(
  userId: string,
  accountName: string
): Promise<boolean> {
  const txRef = transactionsRef(userId);

  const sourceQuery = query(
    txRef,
    where('source', '==', accountName),
    limit(1)
  );
  const sourceSnapshot = await getDocs(sourceQuery);
  if (!sourceSnapshot.empty) return true;

  const destQuery = query(
    txRef,
    where('destination', '==', accountName),
    limit(1)
  );
  const destSnapshot = await getDocs(destQuery);
  return !destSnapshot.empty;
}
