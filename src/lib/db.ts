import Dexie, { type EntityTable } from 'dexie';

interface Task {
    id: number;
    title: string;
    isCompleted: boolean;
    createdAt: Date;
}

interface Tag {
    id: number;
    name: string;
    color: string;
}

interface Session {
    id: number;
    taskId?: number;
    tagId?: number;
    startTime: Date;
    endTime: Date;
    duration: number; // in seconds
    type: 'work' | 'break';
}

const db = new Dexie('FlowFocusDB') as Dexie & {
    tasks: EntityTable<Task, 'id'>;
    sessions: EntityTable<Session, 'id'>;
    tags: EntityTable<Tag, 'id'>;
};

db.version(1).stores({
    tasks: '++id, title, isCompleted, createdAt',
    sessions: '++id, taskId, startTime, endTime, duration, type'
});

db.version(2).stores({
    tags: '++id, name, color',
    sessions: '++id, taskId, tagId, startTime, endTime, duration, type'
});

export { db };
export type { Task, Session };
