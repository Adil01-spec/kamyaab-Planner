# Memory: features/task-execution-tracking
Updated: now

Task execution follows an explicit 4-state machine: idle -> doing -> paused -> done. The `execution_state` field persisted in `plan_json` is the single source of truth. The redundant `execution_status` field is no longer written (legacy read-only).

State transitions:
- idle -> doing (startTask)
- doing -> paused (pauseTask) — preserves accumulated time_spent_seconds
- doing -> done (completeTask)
- paused -> doing (startTask/resume) — adds new live interval to accumulated base

Legacy migration: old 'pending' values are normalized at read-time via `normalizeExecutionState()` — maps to 'paused' if time_spent_seconds > 0, otherwise 'idle'. No batch DB migration needed.

Timer logic uses `accumulated_seconds` (stored in `time_spent_seconds`) plus live elapsed time. Only one task can be in 'doing' state at a time. The `isLocalOpRef` guard prevents useEffect re-initialization when local operations update planData.
