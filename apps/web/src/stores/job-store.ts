import { create } from "zustand";
import {
  cancelWorkerJob,
  completeWorkerJob,
  createWorkerJob,
  failWorkerJob,
  updateWorkerJobProgress,
  type WorkerJobProgressUpdate,
} from "@obscura/media-core";
import type { WorkerJob } from "@obscura/shared";

type BackgroundJobLaunchMetadata = Pick<
  WorkerJob,
  | "fingerprint"
  | "inputSnapshot"
  | "launchId"
  | "sourceAssetId"
  | "sourceAssetKind"
  | "sourceAssetName"
  | "title"
>;

type BackgroundJobResult = NonNullable<WorkerJob["result"]>;

type JobStore = {
  jobs: Record<string, WorkerJob>;
  queueJob: (
    id: string,
    type: WorkerJob["type"],
    message?: string,
    metadata?: BackgroundJobLaunchMetadata,
  ) => void;
  updateJob: (id: string, update: WorkerJobProgressUpdate) => void;
  completeJob: (id: string, message?: string, result?: BackgroundJobResult) => void;
  failJob: (id: string, error: NonNullable<WorkerJob["error"]>) => void;
  cancelJob: (id: string, message?: string) => void;
  clearJob: (id: string) => void;
  resetJobs: () => void;
};

export const useJobStore = create<JobStore>((set) => ({
  jobs: {},
  queueJob: (id, type, message, metadata) => {
    set((state) => ({
      jobs: {
        ...state.jobs,
        [id]: {
          ...createWorkerJob(id, type, message),
          ...metadata,
        },
      },
    }));
  },
  updateJob: (id, update) => {
    set((state) => {
      const job = state.jobs[id];

      if (!job) {
        return state;
      }

      return {
        jobs: {
          ...state.jobs,
          [id]: updateWorkerJobProgress(job, update),
        },
      };
    });
  },
  completeJob: (id, message, result) => {
    set((state) => {
      const job = state.jobs[id];

      if (!job) {
        return state;
      }

      return {
        jobs: {
          ...state.jobs,
          [id]: {
            ...completeWorkerJob(job, message),
            ...(result
              ? {
                  result,
                  ...(result.resultAssetId ? { resultAssetId: result.resultAssetId } : {}),
                }
              : {}),
          },
        },
      };
    });
  },
  failJob: (id, error) => {
    set((state) => {
      const job = state.jobs[id];

      if (!job) {
        return state;
      }

      return {
        jobs: {
          ...state.jobs,
          [id]: failWorkerJob(job, error),
        },
      };
    });
  },
  cancelJob: (id, message) => {
    set((state) => {
      const job = state.jobs[id];

      if (!job) {
        return state;
      }

      return {
        jobs: {
          ...state.jobs,
          [id]: cancelWorkerJob(job, message),
        },
      };
    });
  },
  clearJob: (id) => {
    set((state) => {
      const nextJobs = { ...state.jobs };
      delete nextJobs[id];

      return { jobs: nextJobs };
    });
  },
  resetJobs: () => set({ jobs: {} }),
}));
