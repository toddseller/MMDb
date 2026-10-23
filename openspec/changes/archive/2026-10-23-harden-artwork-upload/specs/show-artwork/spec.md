# Spec Delta

## MODIFIED Requirements

### Requirement: Storage failures are reported
When the file cannot be stored, the upload SHALL answer 502 with a readable message and SHALL NOT expose credentials or storage error details.

#### Scenario: Storage refuses the file
- **WHEN** storage answers an upload with an error
- **THEN** the response is 502 with a message that the artwork couldn't be stored, and no stored poster changes

#### Scenario: Storage credentials are missing
- **WHEN** the server has no storage credentials configured and the owner uploads a valid JPEG
- **THEN** the response is 502 with the same message, nothing is sent to storage, and no stored poster changes
