import Dexie, { type EntityTable } from 'dexie';

interface Task {
    id: number;
    title: string;
    isCompleted: boolean;
    createdAt: Date;
}

interface Session {
    id: number;
    taskId?: number;
    startTime: Date;
    endTime: Date;
    duration: number; // in seconds
    type: 'work' | 'break';
}

const db = new Dexie('FlowFocusDB') as Dexie & {
    tasks: EntityTable<Task, 'id'>;
    sessions: EntityTable<Session, 'id'>;
};

db.version(1).stores({
    tasks: '++id, title, isCompleted, createdAt',
    sessions: '++id, taskId, startTime, endTime, duration, type'
});

export { db };
export type { Task, Session };
