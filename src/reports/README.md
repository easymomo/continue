# Dependency Reports

This directory contains generated reports from the dependency update checker.

## Report Types

### Dependency Update Reports

Files named `dependency-update-YYYY-MM-DD.md` contain information about:

- Outdated dependencies across all package.json files in the project
- Suggested update commands for each package
- Security vulnerabilities found in dependencies and how to fix them

## Generating Reports

To generate a new dependency report, run:

```bash
npm run update:deps
```

This will scan all package.json files in the project, check for outdated dependencies and security issues, and generate a comprehensive report.
