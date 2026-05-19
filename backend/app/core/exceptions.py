from fastapi import Request
from fastapi.responses import JSONResponse


class PatrimonioError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class DataFetchError(PatrimonioError):
    def __init__(self, source: str, detail: str) -> None:
        super().__init__(f"Failed to fetch data from {source}: {detail}", status_code=503)


class ValidationError(PatrimonioError):
    def __init__(self, detail: str) -> None:
        super().__init__(detail, status_code=422)


class NotFoundError(PatrimonioError):
    def __init__(self, resource: str) -> None:
        super().__init__(f"{resource} not found", status_code=404)


async def patrimonio_exception_handler(request: Request, exc: PatrimonioError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "type": type(exc).__name__},
    )
