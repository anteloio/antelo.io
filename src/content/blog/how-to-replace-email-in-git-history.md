---
title: "How to Replace Email in Git History"
description: "Change your Git commit history email using git-filter-repo. A step-by-step guide with setup, usage, and common issues to watch out for."
publishedAt: 2025-04-01
---

## Installation

You'll first need to install git-filter-repo:

```bash
# Using Homebrew on macOS:
brew install git-filter-repo

# Or manually, as per the official documentation:
git clone https://github.com/newren/git-filter-repo.git
cd git-filter-repo
make prefix=/usr/local install
```

## Prevention

Attention! There is a known issue where git-filter-repo removes the remote of your repo. It's not a big deal, but to make sure you can come back to the same state as before, please run `git remote -v` and save these values somewhere. You'll be able to add them back once we're done with this process.

## Usage

Before getting started, you can quickly check the existing occurrences of your email in your git history by running the command:

```bash
git log | grep old_email@example.com
```

To replace the email, then use the `--email-callback` option (see docs), which takes a string that will be evaluated into python, to provide the desired replacement:

```bash
git filter-repo --email-callback '
    return email.replace(b"old_email@example.com", b"new_email@example.com")
'
```

Double-check your email again to make sure there are no occurrences left:

```bash
git log | grep old_email@example.com
```

With that, you can finally push force to the main branch on your remote repo:

```bash
git push origin "$(git_current_branch)" --force
```

## Bonus: commit messages

If you also have occurrences of your old email in the commit messages, for instance:

```bash
git log | grep old_email@example.com
    Co-authored-by: Your Name <old_email@example.com>
    Co-authored-by: Your Name <old_email@example.com>
    Co-authored-by: Your Name <old_email@example.com>

git filter-repo --message-callback '
    return message.replace(b"old_email@example.com", b"new_email@example.com")
'
```

## Known issues

Notice that filter-repo might have removed your remote reference in the process. You can fix that by manually setting your remote URL with:

```bash
git remote add origin git@github.com:username/reponame.git
```
