from .base import BadRequestException, NotFoundException, UnauthorizedException

class MapDoesNotExistException(NotFoundException):
    error_code = "MAP__DOES_NOT_EXIST"
    message = "No map exists with this ID"

class MapNotPublicException(UnauthorizedException):
    error_code = "MAP__NOT_PUBLIC"
    message = "You do not have permission to access this map"