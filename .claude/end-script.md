# /end Command Implementation Guide

This document guides Claude Code instances on how to properly implement the `/end` command for session closure.

## When `/end` is called:

1. **Create Session Notes**
   ```
   Copy .claude/session-template.md to create new session notes:
   - Use format: .claude/sessions/session-XXX.md
   - Fill out all sections with current session information
   - Include all files modified, work completed, current state
   ```

2. **Update Session State**
   ```
   Update .claude/session-state.json:
   - Set current session status to "completed"
   - Update projectStatus with current phase and completed tasks
   - Update technicalState with modified files and testing status
   - Set nextPriorities based on session work
   - Add session summary to notes array
   ```

3. **Review Commit Status**
   ```
   Check if all changes are committed:
   - Run git status to see uncommitted changes
   - If changes exist, recommend committing with descriptive message
   - Update session state with commit status
   ```

4. **Create Handoff Summary**
   ```
   Provide clear handoff information:
   - Summary of work completed in session
   - Current state and any known issues
   - Clear next steps for following session
   - Any blockers or decisions needed
   ```

## Example /end Response Pattern:

```
Ending development session for ENARM Prep. Let me document the work completed...

**Session Summary:**
- Session ID: session-XXX
- Duration: X hours
- Work completed: [Summary of major accomplishments]

**Files Modified:**
[List of changed files with brief descriptions]

**Current State:**
- [What's working now]
- [Any issues or incomplete work]
- [Testing status]

**Next Session Should Focus On:**
1. [High priority task]
2. [Medium priority task]
3. [Low priority task]

**Handoff Notes:**
[Any important context, decisions, or blockers for next developer]

[Check commit status and recommend commits if needed]

Session documentation created at: .claude/sessions/session-XXX.md
Session state updated in: .claude/session-state.json

Ready for next development session!
```

## Required Session Documentation:
- Complete session notes using template
- Updated session-state.json
- Committed changes (or clear notes about uncommitted work)
- Clear priorities for next session