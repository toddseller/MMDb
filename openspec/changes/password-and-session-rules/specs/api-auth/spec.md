# Spec Delta

## MODIFIED Requirements

### Requirement: The API rejects tokens it should not trust
A protected API route SHALL answer 401 with a JSON error message, and SHALL NOT return user data, when the request's token is missing, malformed, expired, has no expiry, was issued by another issuer, was signed with a different secret, or was issued before its user's latest password change.

#### Scenario: Expired token
- **WHEN** a protected route receives a token whose expiry has passed
- **THEN** the response is a 401 with a JSON error message

#### Scenario: Token issued before this change
- **WHEN** a protected route receives a token without an expiry, as every token issued before this change is
- **THEN** the response is a 401, even if the token's signature is valid

#### Scenario: Token signed with the old secret
- **WHEN** a protected route receives a token signed with a secret other than the current one
- **THEN** the response is a 401

#### Scenario: Token from another issuer
- **WHEN** a protected route receives a token signed with the current secret but naming a different issuer
- **THEN** the response is a 401

#### Scenario: No token
- **WHEN** a protected route receives a request without an `Authorization` header
- **THEN** the response is a 401

#### Scenario: Password changed since the token was issued
- **WHEN** a protected route receives an otherwise valid token, and its user has changed their password since it was issued
- **THEN** the response is a 401 with a JSON error message

#### Scenario: Token from before password tracking
- **WHEN** a protected route receives an otherwise valid token issued before tokens recorded the password, as every token issued before this rule is
- **THEN** the response is a 401
