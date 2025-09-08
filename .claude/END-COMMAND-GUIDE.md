# /end Command Implementation Guide

## Quick Reference

When a user calls `/end`, execute this checklist:

### 1. Session Information Gathering ✅
- [ ] Read `.claude/session-state.json`
- [ ] Identify work completed this session
- [ ] List files modified/created
- [ ] Assess current project state

### 2. Create Session Documentation ✅
- [ ] Generate next session number (check `.claude/sessions/` for latest)
- [ ] Copy `.claude/session-template.md` to `.claude/sessions/session-XXX.md`
- [ ] Fill ALL placeholders in the template with actual data
- [ ] Save the completed session documentation

### 3. Update Session State ✅
- [ ] Mark current session as "completed" in `session-state.json`
- [ ] Update `technicalState` with files modified, testing status
- [ ] Set `priorities.nextSession` based on remaining work
- [ ] Update `contextForNextSession` with handoff summary

### 4. Git Status Check ✅
- [ ] Run `git status` to check for uncommitted changes
- [ ] Document any uncommitted files
- [ ] Recommend commit message if changes exist
- [ ] Update session state with git status

### 5. Generate Handoff Summary ✅
- [ ] Provide clear session accomplishments summary
- [ ] Document current working state
- [ ] List priority tasks for next session
- [ ] Note any blockers or decisions needed

## Template Placeholders to Replace

When creating session documentation, replace these placeholders:

```
[SESSION_ID] → session-002 (or next number)
[SESSION_DATE] → 2025-09-08
[START_TIME] → HH:MM (estimate from session-state.json or context)
[END_TIME] → Current time
[DURATION] → Calculated duration
[SESSION_TYPE] → development/debugging/refactoring/testing
[MODIFIED_FILES] → Actual list of files changed
[CREATED_FILES] → Actual list of files created
[FEATURES_IMPLEMENTED] → List of features added/completed
[BUGS_FIXED] → List of issues resolved
[HIGH_PRIORITY_TASKS] → Next session critical tasks
[COMMIT_STATUS] → git status output
[UNCOMMITTED_CHANGES] → List of uncommitted files
```

## Success Verification

Before completing `/end`, ensure:
- ✅ New session file exists in `.claude/sessions/`
- ✅ All placeholders replaced with real data
- ✅ `session-state.json` updated with current progress
- ✅ Git status checked and documented
- ✅ Clear handoff summary provided
- ✅ Next session priorities are actionable

## Example /end Response

```
🔚 Ending development session for ENARM Prep...

**Session Summary:**
- Session ID: session-002
- Duration: 2.5 hours  
- Work completed: Set up comprehensive /end command system

**Files Modified:**
- CLAUDE.md - Added detailed /end command implementation
- .claude/session-template.md - Enhanced with comprehensive placeholders
- .claude/commands/end.md - Updated implementation guide

**Files Created:**
- .claude/END-COMMAND-GUIDE.md - Quick reference guide

**Current State:**
- ✅ Session management system fully operational
- ✅ Both /init and /end commands documented
- ✅ Template system ready for use
- 🔄 No testing of /end workflow completed yet

**Next Session Should Focus On:**
1. **High Priority**: Test the /end command workflow with a practice session
2. **Medium Priority**: Validate session state updates work correctly
3. **Low Priority**: Consider adding automation for session numbering

**Git Status:** 4 files modified, 1 file created - ready for commit

**Handoff Notes:**
The /end command system is now fully implemented and documented. The next session should test the workflow to ensure all components work together properly.

📁 Session documentation: .claude/sessions/session-002.md
📊 Session state updated: .claude/session-state.json
🚀 Ready for next development session with /init!
```

## Common Issues & Solutions

**Issue**: Session number conflicts
**Solution**: Always check existing session files in `.claude/sessions/` before creating new ones

**Issue**: Placeholders not replaced
**Solution**: Use MultiEdit tool to replace all placeholders systematically

**Issue**: Session state JSON syntax errors  
**Solution**: Validate JSON structure before saving updates

**Issue**: Git status unclear
**Solution**: Always run `git status` and `git diff --name-only` for clear file lists