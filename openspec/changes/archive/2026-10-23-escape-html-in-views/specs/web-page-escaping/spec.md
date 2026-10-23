# Spec Delta

## Purpose

Defines how MMDb's own web pages present text that comes from users and external services, such as titles, plots, posters and form values, so that it always shows as text and never runs as markup.

## ADDED Requirements

### Requirement: Stored text never becomes markup on a page
Every page and page fragment SHALL render titles, plots, names, poster URLs and form values as text, so that markup or script in that text is shown or neutralized and never executed or turned into elements.

#### Scenario: Script in a show title
- **WHEN** a show's title is `<script>window.__xss = true</script>` and its owner's shows page is rendered
- **THEN** the page contains no `script` element from the title, and the title text is shown

#### Scenario: Markup in a movie plot
- **WHEN** a movie's plot contains `<img src=x onerror=alert(1)>` and its info view is rendered
- **THEN** the page contains no `img` element from the plot

#### Scenario: XHR fragment
- **WHEN** a page fragment is returned as `page` HTML in a JSON response, such as the shows grid after adding episodes
- **THEN** the fragment is escaped the same way as a full page

### Requirement: Text in attributes can't add attributes
Every attribute value that comes from stored or supplied text SHALL be quoted and escaped, so that the text can't end the attribute or add new ones.

#### Scenario: Title with a space and an event handler
- **WHEN** a movie's title is `x onerror=alert(1)` and a grid showing its poster is rendered
- **THEN** the poster `img` element has no `onerror` attribute, and its `alt` text contains the title

#### Scenario: Poster URL with a quote
- **WHEN** a show's poster URL contains `"` followed by an attribute
- **THEN** the poster `img` element has only the attributes the template defines

### Requirement: Stored entities display as characters
Text stored with HTML entities SHALL display as the characters they stand for, as it does today.

#### Scenario: Plot with an entity
- **WHEN** a plot is stored as `Tom &amp; Jerry`
- **THEN** the page shows `Tom & Jerry`, not `Tom &amp; Jerry`

#### Scenario: Title with a literal ampersand
- **WHEN** a title is stored as `Law & Order`
- **THEN** the page shows `Law & Order`

### Requirement: Raw HTML is limited to the layout and partials
Templates SHALL output raw, unescaped HTML only for the layout's page content and for embedded partials; every other output SHALL be escaped.

#### Scenario: A new raw output is added
- **WHEN** a template outputs anything else without escaping, or puts an output in an unquoted attribute
- **THEN** the test suite fails, naming the file and line
