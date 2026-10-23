# Spec Delta

## REMOVED Requirements

### Requirement: Each webhook request's shape is logged without values
**Reason**: It was added to learn which form Plex sends its webhook in. Every Plex webhook since `fix-plex-webhook-payload` arrived as a multipart `payload` text field with a `thumb` part, so the question is answered and the line is log noise.
**Migration**: None. The webhook still reads the event from a text field, a file part or a JSON body, so a different form from Plex keeps working; if it fails, the access log and error log still show the request.
