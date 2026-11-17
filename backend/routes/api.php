<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\AnomalyController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);

    Route::middleware('auth:api')->group(function () {
        Route::post('logout',  [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me',       [AuthController::class, 'me']);
    });
});

Route::middleware('auth:api')->group(function () {
    Route::get('dashboard/stats', [DashboardController::class, 'stats']);

    Route::apiResource('companies', CompanyController::class);

    Route::apiResource('leads', LeadController::class);
    Route::prefix('leads/{lead}')->group(function () {
        Route::post('activities',                 [LeadController::class, 'addActivity']);
        Route::post('attachments',                [LeadController::class, 'uploadAttachment']);
        Route::delete('attachments/{attachment}', [LeadController::class, 'deleteAttachment']);
    });

    Route::get('notifications',             [NotificationController::class, 'index']);
    Route::post('notifications/read-all',   [NotificationController::class, 'markAllRead']);
    Route::post('notifications/{id}/read',  [NotificationController::class, 'markRead']);

    Route::get('anomalies', [AnomalyController::class, 'index']);

    Route::prefix('ai')->group(function () {
        Route::post('filter',                [AiController::class, 'filterBuilder']);
        Route::post('reply/{lead}',          [AiController::class, 'generateReply']);
        Route::get('suggest-subject/{lead}', [AiController::class, 'suggestSubject']);
    });
});
