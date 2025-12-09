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
    flowmodoroRatio: number; // Ratio denominator (1:5 default)
    earnedBreakTime: number; // Seconds, for Flowmodoro
    startTime: number | null; // Timestamp when current run started
    accumulatedTime: number;  // Seconds accumulated before current run
    taskId: number | null;
    selectedTagId: number | null;

    // Actions
    start: () => void;
    pause: () => void;
    reset: () => void; // Resets completely
    stop: () => Promise<void>; // Finishes session and saves
    skipBreak: () => Promise<void>;
    setMode: (mode: TimerMode) => void;
    setTimerType: (type: TimerType) => void;
    setPomodoroDuration: (minutes: number) => void;
    setFlowmodoroRatio: (ratio: number) => void;
    setTaskId: (id: number | null) => void;
    setTagId: (id: number | null) => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
    status: 'idle',
    mode: 'focus',
    timerType: 'flowmodoro',
    pomodoroDuration: 25,
    flowmodoroRatio: 5, // Default 1:5 ratio
    earnedBreakTime: 0,
    startTime: null,
    accumulatedTime: 0,
    taskId: null,
    selectedTagId: null,

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
            const earned = Math.floor(duration / state.flowmodoroRatio);
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
                tagId: state.selectedTagId || undefined,
            });
        } catch (e) {
            console.error("Failed to save session", e);
        }

        get().reset();
    },

    skipBreak: async () => {
        const state = get();
        if (state.mode !== 'break') return;

        // Stop current session (save it)
        let duration = state.accumulatedTime;
        if (state.status === 'running' && state.startTime) {
            duration += (Date.now() - state.startTime) / 1000;
        }

        if (duration >= 5) {
            try {
                await db.sessions.add({
                    startTime: new Date(Date.now() - duration * 1000),
                    endTime: new Date(),
                    duration: Math.round(duration),
                    type: 'break',
                    taskId: state.taskId || undefined,
                    tagId: state.selectedTagId || undefined,
                });
            } catch (e) {
                console.error("Failed to save skipped break session", e);
            }
        }

        // Switch to Focus and clear earned break time
        set({
            mode: 'focus',
            earnedBreakTime: 0,
            status: 'idle',
            startTime: null,
            accumulatedTime: 0
        });
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

    setFlowmodoroRatio: (ratio) => set({ flowmodoroRatio: ratio }),

    setTaskId: (taskId) => set({ taskId }),

    setTagId: (tagId) => set({ selectedTagId: tagId }),
}));
