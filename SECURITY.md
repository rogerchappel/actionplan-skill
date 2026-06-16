# Security Policy

## Supported Versions

The `main` branch and the latest published package version receive security fixes.

## Reporting a Vulnerability

Please report suspected vulnerabilities through GitHub Security Advisories or by opening a private issue with reproduction details, affected versions, and expected impact.

Do not include secrets, production credentials, or private third-party data in reports. This package is local-first and should not require external service credentials for reproduction.

## Security Model

`actionplan-skill` reads local JSON request files and renders dry-run action plans. It does not execute external actions, call network services, or read credentials.
