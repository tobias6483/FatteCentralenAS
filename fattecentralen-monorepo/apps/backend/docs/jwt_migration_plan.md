# JWT Migration Plan: From Local JWT to Firebase Auth

## Overview
This document outlines the plan to gradually phase out local JWT generation and validation in favor of using Firebase Authentication tokens exclusively. This will streamline authentication, reduce maintenance overhead, and provide more security features.

## Current State
- **Dual Authentication System**: We currently maintain two parallel authentication systems:
  1. Local JWT generation via Flask-JWT-Extended (for API access)
  2. Firebase Authentication (for frontend client auth)
- **User Identity Linking**: We maintain a `firebase_uid` field in our User model to link local user accounts with Firebase Auth accounts
- **Token Flow**: Frontend obtains Firebase ID token, but our backend sometimes still issues its own JWTs which creates complexity

## Target State
- **Single Auth Source**: Firebase Authentication as the single source of truth for authentication
- **Simplified Token Flow**: Frontend obtains Firebase ID token and uses it for all API requests
- **Unified User Identity**: User accounts fully synced with Firebase, using Firebase UID as the primary identifier

## Migration Phases

### Phase 1: Dual-Mode Implementation (Current)
- ✅ Firebase Auth integration implemented alongside existing JWT system
- ✅ Firebase ID token verification capability added to backend
- ✅ User accounts linked via firebase_uid field
- ✅ Both authentication methods supported simultaneously

### Phase 2: New Features Firebase-First (Immediate)
- 🔲 All new API endpoints should use Firebase token verification exclusively
- 🔲 New frontend features should only use Firebase Authentication
- 🔲 Documentation for developers updated to reflect Firebase-first approach

### Phase 3: Gradual Endpoint Migration (1-2 months)
- 🔲 Identify critical endpoints that still rely exclusively on local JWT
- 🔲 Prioritize migration of these endpoints to support Firebase ID tokens
- 🔲 Add Firebase token support to existing endpoints while maintaining backward compatibility
- 🔲 Implement monitoring to track usage of both authentication methods

### Phase 4: Client Migration (2-3 months)
- 🔲 Update frontend to use Firebase ID tokens exclusively where possible
- 🔲 Add fallback mechanisms for older clients that still expect local JWTs
- 🔲 Implement automatic account migration for users still on the old system
- 🔲 Monitor client adoption and usage patterns

### Phase 5: Deprecation Notice (3-4 months)
- 🔲 Announce timeline for full deprecation of local JWT system
- 🔲 Add deprecation warnings in API responses when local JWT is used
- 🔲 Implement auto-migration for remaining accounts on login
- 🔲 Update all documentation to remove references to local JWT

### Phase 6: Complete Removal (4-6 months)
- 🔲 Remove local JWT generation code
- 🔲 Remove all JWT validation paths in favor of Firebase-only authentication
- 🔲 Clean up legacy code and dependencies
- 🔲 Simplify login/registration flows to use Firebase directly

## Implementation Details

### User Account Migration Process
1. Identify users without Firebase UIDs
2. For each login attempt via the old system:
   - Create or link a Firebase account
   - Update the user record with the Firebase UID
   - Return both a local JWT (temporarily) and information about the Firebase account

### API Endpoint Update Strategy
1. Add Firebase ID token verification alongside existing JWT verification
2. Modify route decorators to try Firebase verification first, then fall back to JWT
3. Eventually replace with Firebase-only verification

### Frontend Update Strategy
1. Update authentication stores to handle Firebase tokens primarily
2. Ensure token refresh happens automatically via Firebase SDK
3. Update all API calls to use Firebase ID tokens in Authorization headers

## Fallback Strategy
If issues arise during migration:
1. Ability to temporarily re-enable local JWT generation
2. Monitoring to detect authentication failures
3. Account recovery process for users who encounter issues

## Security Considerations
- Ensure proper token validation on all endpoints
- Implement rate limiting for token verification
- Ensure secure storage of Firebase service account key
- Review Firebase security rules regularly

## Testing Strategy
- Unit tests for all authentication paths
- Integration tests for token verification
- E2E tests for user flows
- Load testing for Firebase token verification

## Success Metrics
- 100% of endpoints supporting Firebase authentication
- 0% of requests using local JWT authentication
- No increase in authentication failures during migration
- Simplified codebase with reduced complexity

This plan will be reviewed and updated regularly as the migration progresses.
