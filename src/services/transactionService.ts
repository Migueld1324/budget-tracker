import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Transaction, TransactionInput } from '../types';
import { formatPeriod } from '../utils/periodUtils';

function transactionsRef(userId: string) {
  return collection(db, 'users', userId, 'transactions');
}

function derivePeriod(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return formatPeriod(month, year);
}

export async function getByPeriod(
  userId: string,
  period: string
): Promise<Transaction[]> {
  const q = query(
    transactionsRef(userId),
    where('period', '==', period)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    userId,
    ...d.data(),
  })) as Transaction[];
}

export async function getAll(userId: string): Promise<Transaction[]> {
  const snapshot = await getDocs(transactionsRef(userId));
  return snapshot.docs.map((d) => ({
    id: d.id,
    userId,
    ...d.data(),
  })) as Transaction[];
}


export async function create(
  userId: string,
  data: TransactionInput
): Promise<string> {
  const period = derivePeriod(data.date);
  const docRef = await addDoc(transactionsRef(userId), {
    ...data,
    userId,
    period,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function update(
  userId: string,
  id: string,
  data: Partial<TransactionInput>
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'transactions', id);
  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  if (data.date) {
    updateData.period = derivePeriod(data.date);
  }
  await updateDoc(docRef, updateData);
}

export async function remove(
  userId: string,
  id: string
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'transactions', id);
  await deleteDoc(docRef);
}

export function subscribeByPeriod(
  userId: string,
  period: string,
  callback: (txns: Transaction[]) => void
): Unsubscribe {
  const q = query(
    transactionsRef(userId),
    where('period', '==', period)
  );
  return onSnapshot(q, (snapshot) => {
    const txns = snapshot.docs.map((d) => ({
      id: d.id,
      userId,
      ...d.data(),
    })) as Transaction[];
    callback(txns);
  });
}
