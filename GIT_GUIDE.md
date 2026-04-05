# Git Branch Guide - se-toolkit-hackathon

## Current Status

Your repository is currently:
- **Branch:** `main`
- **Remote:** `https://github.com/Original-Show/se-toolkit-hackathon.git`
- **Remote branches:** Only `origin/main` exists
- **Local changes:** Not committed (see below)

---

## ⚠️ IMPORTANT: Save Your Current Changes First!

You have **uncommitted changes** in your local repository. Before switching branches, you need to either **commit** or **stash** them.

### Option 1: Commit Your Changes (Recommended)

```bash
# Navigate to your project
cd /home/yaroslav/Documents/prog/software-engineering-toolkit/se-toolkit-hackathon

# Stage all changes
git add .

# Commit with a message
git commit -m "Add new features: favorites, tags, bookmarks, responsive design, validation, tools menu, food-themed colors"

# Push to remote (optional)
git push origin main
```

### Option 2: Stash Your Changes (Temporary storage)

```bash
# Stash all changes
git stash -u

# Later, to get them back:
git stash pop
```

---

## 🌿 How to Switch Branches

### Scenario 1: Switch to an Existing Remote Branch

If someone created a branch on GitHub and you want to get it:

```bash
# 1. Fetch all remote branches
git fetch origin

# 2. List all available remote branches
git branch -r

# 3. Switch to the branch (creates local tracking branch)
git checkout -b branch-name origin/branch-name

# OR (Git 2.23+)
git switch branch-name
```

### Scenario 2: Create a New Branch Locally

```bash
# Create and switch to new branch
git checkout -b my-new-branch

# OR (Git 2.23+)
git switch -c my-new-branch

# Push it to remote
git push -u origin my-new-branch
```

### Scenario 3: Get Latest Changes from Remote

```bash
# Fetch latest changes from remote
git fetch origin

# If you're on main and want latest:
git pull origin main

# If you're on another branch:
git pull origin branch-name
```

---

## 📋 Common Commands Cheat Sheet

### View Branches
```bash
# List local branches
git branch

# List remote branches
git branch -r

# List all branches
git branch -a
```

### Switch Branches
```bash
# Switch to existing branch
git switch branch-name
# OR
git checkout branch-name

# Create and switch to new branch
git switch -c new-branch-name
# OR
git checkout -b new-branch-name
```

### Get Changes from Remote
```bash
# Fetch (download without merging)
git fetch origin

# Pull (fetch + merge)
git pull origin branch-name

# Fetch all remotes
git fetch --all
```

### Save Changes
```bash
# Stage all changes
git add .

# Stage specific files
git add filename

# Commit
git commit -m "your message"

# Push to remote
git push origin branch-name
```

### Stash (Temporary Save)
```bash
# Stash all changes (including untracked)
git stash -u

# Stash only tracked files
git stash

# List stashes
git stash list

# Apply latest stash
git stash pop

# Apply specific stash
git stash pop stash@{0}
```

---

## 🔧 Complete Example Workflow

### You want to create a new feature branch:

```bash
# 1. Make sure you're on main and up to date
cd /home/yaroslav/Documents/prog/software-engineering-toolkit/se-toolkit-hackathon
git checkout main
git pull origin main

# 2. Commit your current changes
git add .
git commit -m "Add responsive design, favorites, tags, bookmarks, validation"

# 3. Create new branch
git switch -c feature/cool-stuff

# 4. Push to remote
git push -u origin feature/cool-stuff

# 5. Make more changes...
# ... edit files ...

# 6. Commit and push
git add .
git commit -m "Add awesome feature"
git push
```

### Someone else created a branch and you want to get it:

```bash
# 1. Fetch all remote branches
git fetch origin

# 2. See what branches exist
git branch -r

# 3. Switch to their branch
git switch their-branch-name
# OR if it doesn't exist locally yet:
git switch -c their-branch-name origin/their-branch-name

# 4. Get latest changes
git pull origin their-branch-name
```

---

## 🚨 Common Issues

### Issue: "Your local changes would be overwritten by checkout"

**Solution:** Commit or stash first!
```bash
# Commit
git add . && git commit -m "Save my work"

# OR stash
git stash -u

# Then switch branches
git switch branch-name
```

### Issue: Branch doesn't exist on remote

**Solution:** You need to push it first
```bash
# Create and push
git switch -c my-branch
git push -u origin my-branch
```

### Issue: "fatal: refusing to merge unrelated histories"

**Solution:**
```bash
git pull origin branch-name --allow-unrelated-histories
```

---

## 🔗 Remote Repository Management

### Add/Change Remote
```bash
# View remotes
git remote -v

# Add new remote
git remote add upstream https://github.com/Original-Show/se-toolkit-hackathon.git

# Change remote URL
git remote set-url origin https://new-url.git
```

### Push to Remote
```bash
# Push current branch
git push

# Push specific branch
git push origin branch-name

# Force push (dangerous!)
git push --force
```

---

## 💡 Pro Tips

1. **Always commit before switching branches** - Don't leave work hanging
2. **Use descriptive branch names** - `feature/add-search` not `branch1`
3. **Pull before you start working** - Stay up to date
4. **Commit often, push regularly** - Don't lose work
5. **Use `git status` often** - Know what's going on

---

## 📊 Your Current State

```
Branch: main
Remote: origin/main (same commit)
Local Changes: UNCOMMITTED (need to commit or stash!)

Files to commit:
- README.md (modified)
- .gitignore (new)
- CHANGELOG.md (new)
- DEMO_GUIDE.md (new)
- FEATURES_SUMMARY.md (new)
- UI_IMPROVEMENTS.md (new)
- backend/* (new)
- docker-compose.yml (new)
- docker/* (new)
- frontend/* (new)
- scripts/* (new)
```

---

## 🚀 Quick Start - Do This Now!

```bash
cd /home/yaroslav/Documents/prog/software-engineering-toolkit/se-toolkit-hackathon

# 1. Save all your work
git add .
git commit -m "Add features: favorites, tags, bookmarks, validation, responsive design, food theme"

# 2. Push to GitHub
git push origin main

# 3. Now you can safely switch branches!
git switch branch-name
```
