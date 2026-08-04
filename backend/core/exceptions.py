# Re-export exception types from the canonical exceptions module for
# convenience (imports may reference backend.core.exceptions).
from backend.exceptions import (
    VitalitException,
    DatabaseException,
    ValidationException,
    AuthenticationException,
    AuthorizationException,
    BusinessLogicException,
    ResourceNotFoundException,
    ConflictException,
    create_http_exception,
    PatientNotFoundException,
    DoctorNotFoundException,
    AppointmentConflictException,
    InsufficientInventoryException,
    InvalidCredentialsException,
    InsufficientPermissionsException,
)