export const TRASH_CAP = 50;

export interface TrashLike {
  id?: number;
  deletedAt: string;
}

export function capTrash(items: TrashLike[], cap = TRASH_CAP): TrashLike[] {
  return [...items]
    .sort((a, b) => Date.parse(b.deletedAt) - Date.parse(a.deletedAt))
    .slice(0, cap);
}