---
name: "github-uploader"
description: "Handles Git operations (add, commit, push) and GitHub repository management. Invoke when user wants to upload code to GitHub, sync changes, or fix remote branch issues."
---

# GitHub Uploader Skill

Expert guidance for managing code synchronization with GitHub. This skill helps in common Git workflows, performance optimization on Windows, and troubleshooting remote repository issues.

## Core Workflows

### 1. Standard Push
Use this workflow for regular code updates:
```powershell
git add .
git commit -m "feat: your descriptive message"
git push origin master
```

### 2. Fixing Remote Branch Issues
If the remote branch is missing or tracking is broken (e.g., `[origin/master: gone]`):
```powershell
# Fetch remote updates
git fetch origin

# Reset upstream tracking
git branch --unset-upstream
git branch -u origin/master master
```

### 3. Optimizing Performance on Windows
For projects with many files (e.g., node_modules), enable these features to speed up `git status`:
```powershell
git config core.untrackedCache true
git config core.fsmonitor true
```

### 4. Handling Line Endings
To avoid noisy diffs from CRLF/LF conversions:
```powershell
git config core.autocrlf true
```

## Best Practices
- **Clean Untracked Files**: Ensure `.gitignore` is up-to-date. Remove old backup files (`*.bak`) before pushing.
- **Commit Messages**: Use conventional commits (e.g., `feat:`, `fix:`, `refactor:`) for better history readability.
- **Large Files**: Avoid committing large binary files. Use `.gitignore` for data files like `data.json`.
