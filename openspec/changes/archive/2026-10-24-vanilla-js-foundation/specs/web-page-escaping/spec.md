# Spec Delta

## MODIFIED Requirements

### Requirement: Raw HTML is limited to the layout and partials
Templates SHALL output raw, unescaped HTML only for the layout's page content, for embedded partials, and for the layout's script import map, which is JSON the server builds from the app's own module file names with no user data; every other output SHALL be escaped.

#### Scenario: A new raw output is added
- **WHEN** a template outputs anything else without escaping, or puts an output in an unquoted attribute
- **THEN** the test suite fails, naming the file and line

#### Scenario: The import map
- **WHEN** the layout writes its script import map
- **THEN** the map is output unescaped, so the browser can read it as JSON, and the escaping check still passes
