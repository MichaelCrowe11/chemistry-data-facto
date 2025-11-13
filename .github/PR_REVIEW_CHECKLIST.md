# Pull Request Review Checklist
**Use this checklist when reviewing PRs to ensure consistency and quality**

---

## Before You Start

- [ ] Read the PR description and understand the goal
- [ ] Check if there are related/duplicate PRs
- [ ] Look at the file changes overview (additions/deletions)
- [ ] Check CI/CD status (builds, tests, linting)

---

## Code Review

### General Quality
- [ ] Code follows existing patterns and conventions
- [ ] No unnecessary complexity
- [ ] Clear variable/function names
- [ ] Comments where needed (but not excessive)
- [ ] No debug code (console.logs, commented blocks)

### TypeScript Specific
- [ ] Proper type definitions (no `any` unless necessary)
- [ ] Correct file extensions (`.ts` for code, `.tsx` for JSX)
- [ ] No TypeScript errors
- [ ] Interfaces/types exported from appropriate locations

### React Specific
- [ ] Hooks follow Rules of Hooks
- [ ] Dependencies arrays are correct
- [ ] No unnecessary re-renders
- [ ] Proper cleanup in useEffect
- [ ] Accessible components (ARIA labels, keyboard nav)

### Security
- [ ] No hardcoded secrets/API keys
- [ ] User input is validated
- [ ] No use of dangerous functions (eval, innerHTML without sanitization)
- [ ] Proper authentication/authorization checks
- [ ] Dependencies are up to date and secure

---

## Testing

- [ ] Existing tests still pass
- [ ] New tests added for new functionality
- [ ] Edge cases covered
- [ ] Error cases tested
- [ ] Test coverage doesn't decrease

**Current Note:** Repository has 0% test coverage. Priority to add tests!

---

## Documentation

- [ ] README updated if needed
- [ ] New features documented
- [ ] Breaking changes noted
- [ ] API changes documented
- [ ] Comments explain "why" not just "what"

---

## Performance

- [ ] No obvious performance issues
- [ ] Large lists properly virtualized
- [ ] Images optimized
- [ ] Bundle size impact considered
- [ ] Lazy loading used where appropriate

---

## Size Guidelines

| PR Size | Lines Changed | Review Time | Recommendation |
|---------|---------------|-------------|----------------|
| Tiny | < 10 | 5 min | ✅ Ideal for quick fixes |
| Small | 10-100 | 15 min | ✅ Good |
| Medium | 100-500 | 30-60 min | ⚠️ Consider breaking up |
| Large | 500-1,000 | 2-4 hours | ⚠️ Should be broken up |
| Huge | > 1,000 | 1 day+ | ❌ Must be broken up |

**Action:** If PR is > 500 lines, request author to break into smaller PRs

---

## Common Issues to Watch For

### Duplicates
- [ ] Search for similar open PRs before creating
- [ ] Check if issue is already fixed in another branch
- [ ] Comment on related PRs for coordination

### Merge Conflicts
- [ ] Conflicts resolved before review
- [ ] Rebase on latest main/develop
- [ ] Tests still pass after rebase

### Fast-Tracking

✅ **Can Fast-Track (Quick Approve):**
- Dependency updates from Dependabot (if tests pass)
- Typo fixes in documentation
- Minor style/formatting changes
- Version bumps with no code changes

❌ **Cannot Fast-Track (Full Review Required):**
- Security-related changes
- Breaking API changes
- Large refactors
- New features

---

## Review Decision Matrix

### ✅ APPROVE
**When:**
- All checklist items pass
- Code quality is good
- Tests are present and passing
- No security concerns
- Documentation is complete

**Action:** Approve and merge

### 📝 COMMENT
**When:**
- Minor issues that don't block merge
- Suggestions for improvement
- Questions about approach
- Style preferences

**Action:** Comment and still approve if issues are minor

### ⚠️ REQUEST CHANGES
**When:**
- Security vulnerabilities
- Breaking changes without discussion
- Major code quality issues
- Missing tests for complex features
- Performance problems
- Merge conflicts

**Action:** Request changes with specific feedback

### ❌ CLOSE
**When:**
- Duplicate of another PR
- Solves non-existent problem
- Stale (no activity for 2+ weeks)
- Author requested closure
- Goes against project direction

**Action:** Close with kind explanation

---

## Review Comments Template

### For Approval
```
✅ LGTM! 

**What I checked:**
- Code quality and style
- TypeScript types
- No security issues
- Builds successfully

**Notes:**
[Any optional notes or suggestions]

Approved to merge! 🚀
```

### For Requesting Changes
```
⚠️ Requesting changes

**Issues to Address:**
1. [Specific issue with file/line reference]
2. [Another specific issue]

**Suggestions:**
- [Helpful suggestion]
- [Another suggestion]

Please address these and I'll review again. Happy to discuss any of these points!
```

### For Closing Duplicate
```
❌ Closing as duplicate of PR #[number]

This PR addresses the same issue as PR #[number]. To avoid confusion and keep our PR list clean, I'm closing this one.

Thank you for the contribution! Please check out PR #[number] if you'd like to follow the progress on this issue.
```

---

## Special Cases

### Dependabot PRs
1. Check that CI passes
2. Review CHANGELOG or release notes if major version
3. Quick smoke test if critical dependency
4. Merge if all looks good

### Emergency Fixes
- Can skip some process for critical production bugs
- But still require security review
- Document why fast-tracked in PR description

### Documentation Only
- Lower bar for approval
- Check for accuracy and completeness
- Verify links work
- Can merge even with minor issues

---

## After Merge

- [ ] Delete branch (if not auto-deleted)
- [ ] Update related issues
- [ ] Monitor for any issues in production
- [ ] Thank the contributor

---

## Time Estimates

| PR Type | Target Review Time |
|---------|-------------------|
| Dependency update | < 10 minutes |
| Bug fix (< 100 lines) | 15-30 minutes |
| Small feature (< 500 lines) | 30-60 minutes |
| Large feature (> 500 lines) | Request breakdown |

**Goal:** Review all PRs within 48 hours to prevent duplicates and keep momentum

---

## Questions or Issues?

If unsure about a review decision:
1. Ask questions in PR comments
2. Request another reviewer's input
3. Test locally if uncertain
4. Check with project maintainer

**Remember:** It's better to ask than approve something you're unsure about!

---

Last Updated: November 12, 2025
