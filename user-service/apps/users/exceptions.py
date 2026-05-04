class ConflictError(Exception):
    """Raised when a register request conflicts with existing user data."""

    def __init__(self, detail):
        super().__init__("Conflict")
        self.detail = detail
