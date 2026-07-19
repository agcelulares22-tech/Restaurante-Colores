const serializationTails = new Map<string, Promise<void>>();

export async function withSerializedKey<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = serializationTails.get(key) || Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>(resolve => {
    release = resolve;
  });
  const tail = previous.catch(() => undefined).then(() => current);
  serializationTails.set(key, tail);

  await previous.catch(() => undefined);
  try {
    return await task();
  } finally {
    release();
    if (serializationTails.get(key) === tail) {
      serializationTails.delete(key);
    }
  }
}
