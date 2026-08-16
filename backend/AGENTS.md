# Repository Agent Instructions

## Project Direction

- This project is a Django REST Framework API for a Spotify-like application.
- Do not add Django apps, models, or domain abstractions unless explicitly requested.
- Always use Django REST Framework best practices when adding or changing API code.
- Prefer built-in Django and DRF features over custom implementations whenever they are intended for the use case.
- Do not force, hack, or misuse Django/DRF abstractions to solve problems they were not designed to solve; use them only when they fit naturally.

## Project Structure

- Keep the Django project package named `config`; it holds configuration, not domain code.
- Prefer split requirements under `requirements/` with `base.txt`, `dev.txt`, and `prod.txt` instead of a single requirements file when dependency sets diverge.
- Prefer split settings under `config/settings/` with `base.py`, `dev.py`, and `prod.py` when environment-specific settings grow.
- Select settings with `DJANGO_SETTINGS_MODULE`; load secrets and deployment-specific values from environment variables.
- Put all domain apps under `apps/` and organize them as vertical slices by domain, not by framework layer.
- Each app should own its `models.py`, `serializers.py`, `views.py` or `viewsets.py`, `urls.py`, `permissions.py`, `filters.py`, `services.py`, optional `selectors.py`, `tasks.py`, `migrations/`, and `tests/`.
- If a file grows too large, split it into a package such as `models/` or `serializers/` while preserving the same domain ownership.

## Domain App Patterns

- Keep views thin: validate input with serializers, call service functions for business workflows, and return responses.
- Put multi-step business operations in `services.py`, not in serializer `create()`/`update()` methods or large view methods.
- Use model methods for row-level behavior and custom managers/querysets for reusable query logic.
- Use a shared abstract timestamp base model for `created_at` and `updated_at` when models are introduced.
- Use `TextChoices` instead of raw string constants for model state fields.
- Use separate read and write serializers when response shape and write payload shape diverge.
- Avoid `fields = "__all__"` in serializers; always list fields explicitly to avoid leaking future columns.
- Avoid deeply nested writable serializers; prefer flat write serializers with primary keys or separate endpoints.
- Avoid one giant `api` app; each domain app owns its API layer.
- Avoid cross-app model manipulation from views; call the owning app's service functions.

## API Implementation

- Prefer `ViewSet` and `ModelViewSet` patterns where they fit the resource.
- Use `APIView` only when the endpoint does not map cleanly to a resource/viewset action.
- Keep serializers explicit and validate input at the serializer boundary.
- Use DRF routers for viewsets instead of hand-writing equivalent CRUD URL patterns.
- Define `permission_classes` explicitly for API views and viewsets.
- Define throttling intentionally for public, authenticated, and high-cost endpoints.
- Do not rely on frontend checks for authorization or object ownership.
- Always paginate list endpoints using Django built-it pagination.
- Guard against N+1 queries with `select_related` and `prefetch_related` in `get_queryset()`.
- Use CRUD patterns as possible. But keep it simple, for example if some API does not need update, then don't implement put or patch for it.

## Routing

- Let each app define its own `urls.py`.
- Compose app routes from `config/api_urls.py` when there are multiple API apps.
- Keep `config/urls.py` focused on root concerns such as admin, schema, docs, and the versioned API include.
- Register viewsets with DRF routers and always set `basename` explicitly.
- Use plural nouns for URLs, such as `/conversations/` and `/messages/`, not verb-based paths like `/get-messages/`.
- Use custom `@action` endpoints for resource actions, such as `POST /api/v1/conversations/{id}/archive/`.
- Use `APIView` or DRF generic views for non-resource endpoints such as authentication callbacks or login flows.

## Cross-Cutting Defaults

- Prefer global DRF defaults in settings for authentication, deny-by-default permissions, pagination, filters, schema class, and baseline throttles.
- Default permissions should be `IsAuthenticated`; open public endpoints explicitly with `AllowAny`.
- JWT should be the default authentication mechanism once authentication is implemented.
- Use drf-spectacular as the OpenAPI schema generator and expose schema/docs consistently.
- If a data should not be modified in an API, define it as read-only

## Authentication And Authorization

- Authentication is expected to use JWT.
- Account linking is planned; design user/account relationships so multiple identity providers can map safely to one user.
- Any endpoint that reads, writes, updates, deletes, downloads, or lists user-owned resources must enforce object-level ownership.
- Indirect object ownership must also be verified. For example, sending a message to a conversation must first prove the conversation belongs to `request.user`; accessing an attachment through a message must prove the attachment's parent message and conversation belong to `request.user`.
- Prevent IDOR vulnerabilities: no user may access another user's conversations, messages, attachments, generated files, linked accounts, API keys, billing data, or similar private resources.
- Querysets for user-owned resources must be scoped to `request.user` before object lookup whenever possible.
- For object-level authorization, combine queryset scoping with DRF permissions such as `has_object_permission`.
- Avoid exposing sequential identifiers for sensitive resources unless ownership checks are strict and tested.

## drf-spectacular

- Keep OpenAPI documentation accurate and useful for real clients.
- Use `extend_schema`, `extend_schema_view`, `OpenApiExample`, `OpenApiParameter`, and explicit request/response serializers where appropriate.
- Examples must be real working examples that match the serializers, expected payloads, response shapes, status codes, and authentication requirements.
- Document permissions, throttling behavior, authentication requirements, and error responses for API endpoints when they matter to clients.
- Do not add placeholder, fake, or misleading schema examples.

## Security Expectations

- Validate uploads, attachment ownership, and message ownership on every relevant request.
- Never trust client-provided user IDs for ownership assignment; use `request.user`.
- Avoid returning internal IDs, paths, stack traces, secrets, tokens, or provider credentials in API responses.
- Prefer deny-by-default permissions for new authenticated resources.

## Testing Expectations

- Add tests for permissions and ownership whenever adding user-owned API endpoints.
- Include negative tests proving one user cannot access another user's resources.
- Add schema validation or schema-focused tests when adding complex drf-spectacular annotations.