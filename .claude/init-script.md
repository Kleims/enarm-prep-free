# /init Command Implementation Guide

This document guides Claude Code instances on how to properly implement the `/init` command for session continuity.

## When `/init` is called:

1. **Read Session State**
   ```
   Read .claude/session-state.json to understand:
   - Current project phase and status
   - Last completed tasks
   - Current priorities and focus areas
   - Technical state (modified files, branch, etc.)
   ```

2. **Review Last Session**
   ```
   Find and read the most recent session notes in .claude/sessions/
   Pay attention to:
   - Work completed in last session
   - Current state and known issues
   - Next session priorities
   - Any blockers or handoff notes
   ```

3. **Set Up TodoWrite**
   ```
   Create TodoWrite tasks based on:
   - nextPriorities from session-state.json
   - High/Medium priority items from last session notes
   - Any incomplete work that needs continuation
   ```

4. **Provide Context Summary**
   ```
   Give user a brief summary of:
   - Current project status
   - What was accomplished recently
   - What will be worked on in this session
   - Any important context or decisions from previous work
   ```

## Example /init Response Pattern:

```
I'm initializing development session for ENARM Prep. Let me review the current state...

**Current Project Status:**
- Phase: [current phase from session state]
- Last session completed: [date and key accomplishments]
- Focus area: [current focus from state]

**Previous Work:**
- [Summary of recently completed tasks]
- [Any important changes or decisions made]

**This Session Priorities:**
[Set up TodoWrite with appropriate tasks based on session state and last session notes]

**Context Notes:**
[Any important technical context, blockers, or decisions needed]

Ready to continue development!
```

## Session State Update Pattern:
When work begins, update session-state.json with:
- New sessionId
- Current date
- Set status to "active"
- Update lastActivity with current work focus