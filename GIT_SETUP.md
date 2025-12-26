# Git Setup for pjklein Forks

## Remotes Configuration

### Frontend (`frontend/`)
```
origin   → git@github.com:pjklein/stx-node-map.git (your fork)
upstream → git@github.com:talhasch/stx-node-map.git (original)
```

### Backend (`backend/`)
```
origin   → git@github.com:pjklein/stx-node-map-backend.git (your fork)
upstream → git@github.com:talhasch/stx-node-map-backend.git (original)
```

## Workflow

### Push changes to your fork
```bash
git push origin develop
```

### Sync with upstream (get latest from original)
```bash
git fetch upstream
git rebase upstream/develop
```

### Create pull request
Push to your fork, then create a PR from your fork to the original repository on GitHub.

## Repository Links

- **Frontend Fork**: https://github.com/pjklein/stx-node-map
- **Frontend Original**: https://github.com/talhasch/stx-node-map
- **Backend Fork**: https://github.com/pjklein/stx-node-map-backend
- **Backend Original**: https://github.com/talhasch/stx-node-map-backend

## Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Commit: `git commit -m "Description of changes"`
4. Push: `git push origin feature/my-feature`
5. Create a PR on GitHub from your fork to the original repo
