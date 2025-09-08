---
description: End current development session with proper documentation
allowed-tools: Bash(git *:*), Read(*), Write(*), Edit(*), MultiEdit(*)
---

# /end Command Implementation

Ending development session for ENARM Prep. Let me document the work completed and update session state...

## Implementation Steps

### 1. Gather Current Session Information
- Read current session-state.json
- Identify work completed this session
- List files modified during session
- Assess current project state

### 2. Create Session Documentation
- Generate next session number
- Copy session-template.md to sessions/session-XXX.md  
- Fill all sections with current session details
- Document files modified, features implemented, bugs fixed

### 3. Update Session State
- Mark current session as completed
- Update technical state (files, testing status, build status)
- Set next session priorities based on work completed
- Update project phase and completion status
- Add context summary for next session handoff

### 4. Check Git Status
- Run git status to check for uncommitted changes
- If changes exist, recommend commit with descriptive message
- Update session state with commit information

### 5. Generate Handoff Summary
- Summarize major accomplishments
- Document current working state
- List priority tasks for next session
- Note any blockers or decisions needed
- Provide clear context for continuation

## Success Criteria
Session properly ended when:
- Session notes created in .claude/sessions/
- Session state updated in .claude/session-state.json
- Git status checked and uncommitted changes handled
- Clear handoff summary provided
- Next session priorities documented