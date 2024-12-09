from .base import BadRequestException, NotFoundException, UnauthorizedException

class UserDoesNotExistException(NotFoundException):
    error_code = "USER__DOES_NOT_EXIST"
    message = "User does not exist"

class EmailDoesNotExistException(NotFoundException):
    error_code = "USER__DOES_NOT_EXIST"
    message = "No user exists with this email"

class UsernameAlreadyExistsException(BadRequestException):
    error_code = "USER__USERNAME_ALREADY_EXISTS"
    message = "User already exists with this username"

class EmailAlreadyExistsException(BadRequestException):
    error_code = "USER__EMAIL_ALREADY_EXISTS"
    message = "User already exists with this email"

class PasswordTooShortException(BadRequestException):
    error_code = "USER__PASSWORD_TOO_SHORT"
    message = "Password must consist of at least 4 characters"

class InvalidCredentialsException(UnauthorizedException):
    error_code = "USER__INVALID_CREDENTIALS"
    message = "Invalid credentials provided for user"