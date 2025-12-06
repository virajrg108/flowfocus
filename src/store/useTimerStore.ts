import { create } from 'zustand';
import { db } from '../lib/db';

type TimerStatus = 'idle' | 'running' | 'paused';
type TimerMode = 'focus' | 'break';
type TimerType = 'flowmodoro' | 'pomodoro';

interface TimerState {
    status: TimerStatus;
    mode: TimerMode;
    timerType: TimerType;
    pomodoroDuration: number; // Minutes
    earnedBreakTime: number; // Seconds, for Flowmodoro
    startTime: number | null; // Timestamp when current run started
    accumulatedTime: number;  // Seconds accumulated before current run
    taskId: number | null;

    // Actions
    start: () => void;
    pause: () => void;
    reset: () => void; // Resets completely
    stop: () => Promise<void>; // Finishes session and saves
    setMode: (mode: TimerMode) => void;
    setTimerType: (type: TimerType) => void;
    setPomodoroDuration: (minutes: number) => void;
    setTaskId: (id: number | null) => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
    status: 'idle',
    mode: 'focus',
    timerType: 'flowmodoro',
    pomodoroDuration: 25,
    earnedBreakTime: 0,
    startTime: null,
    accumulatedTime: 0,
    taskId: null,

    start: () => set((state) => {
        if (state.status === 'running') return state;

        // If starting a new Focus session, clear previous earned break? 
        // Usually yes, you earn a new break.
        const updates: Partial<TimerState> = {
            status: 'running',
            startTime: Date.now()
        };

        if (state.mode === 'focus') {
            updates.earnedBreakTime = 0;
        }

        return updates;
    }),

    pause: () => set((state) => {
        if (state.status !== 'running' || !state.startTime) return state;
        const now = Date.now();
        const elapsed = (now - state.startTime) / 1000;
        return {
            status: 'paused',
            startTime: null,
            accumulatedTime: state.accumulatedTime + elapsed,
        };
    }),

    reset: () => set({
        status: 'idle',
        startTime: null,
        accumulatedTime: 0,
    }),

    stop: async () => {
        const state = get();

        let duration = state.accumulatedTime;
        if (state.status === 'running' && state.startTime) {
            duration += (Date.now() - state.startTime) / 1000;
        }

        const minimumDuration = 5;

        // Calculation for Flowmodoro Break
        if (state.timerType === 'flowmodoro' && state.mode === 'focus') {
            const earned = Math.floor(duration / 5);
            if (earned > 0) {
                set({ earnedBreakTime: earned });
            }
        }

        if (duration < minimumDuration) {
            get().reset();
            return;
        }

        try {
            await db.sessions.add({
                startTime: new Date(Date.now() - duration * 1000),
                endTime: new Date(),
                duration: Math.round(duration),
                type: state.mode === 'focus' ? 'work' : 'break',
                taskId: state.taskId || undefined,
            });
        } catch (e) {
            console.error("Failed to save session", e);
        }

        get().reset();
    },

    setMode: (mode) => set({ mode }),

    setTimerType: (type) => {
        const current = get();
        if (current.timerType !== type) {
            current.reset();
            set({ timerType: type });
        }
    },

    setPomodoroDuration: (minutes) => set({ pomodoroDuration: minutes }),

    setTaskId: (taskId) => set({ taskId }),
}));
