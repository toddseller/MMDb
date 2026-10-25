# Spec Delta

## MODIFIED Requirements

### Requirement: Only the show's owner can upload
An artwork upload SHALL be refused, and nothing stored, unless the request comes from a signed-in user who is the user in the URL and has the show in their collection. It SHALL answer 401 when nobody is signed in, and 403 when someone is signed in but is not the user in the URL or does not have the show.

#### Scenario: Not signed in
- **WHEN** a visitor who is not signed in uploads artwork
- **THEN** the response is 401 and nothing is stored

#### Scenario: Another user's show
- **WHEN** a signed-in user uploads artwork for a show that is not in their collection, or under another user's URL
- **THEN** the response is 403 and nothing is stored
