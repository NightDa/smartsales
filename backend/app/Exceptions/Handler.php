<?php
namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontFlash = ['current_password', 'password', 'password_confirmation'];

    public function render($request, Throwable $e): JsonResponse
    {
        if ($e instanceof \Tymon\JWTAuth\Exceptions\TokenExpiredException) return response()->json(['message' => 'Token expired.'], 401);
        if ($e instanceof \Tymon\JWTAuth\Exceptions\TokenInvalidException) return response()->json(['message' => 'Token invalid.'], 401);
        if ($e instanceof \Tymon\JWTAuth\Exceptions\JWTException)          return response()->json(['message' => 'Token absent.'], 401);
        if ($e instanceof AuthenticationException)                          return response()->json(['message' => 'Unauthenticated.'], 401);
        if ($e instanceof ValidationException)                              return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        if ($e instanceof ModelNotFoundException)                           return response()->json(['message' => class_basename($e->getModel()).' not found.'], 404);
        if ($e instanceof \Illuminate\Auth\Access\AuthorizationException)  return response()->json(['message' => 'Unauthorized.'], 403);
        if ($e instanceof HttpException)                                    return response()->json(['message' => $e->getMessage() ?: 'HTTP error.'], $e->getStatusCode());

        return response()->json(['message' => app()->hasDebugModeEnabled() ? $e->getMessage() : 'Server error.'], 500);
    }
}
