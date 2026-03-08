<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Future protected routes go here.
});

Route::middleware(['auth:sanctum', 'is_admin'])->group(function () {
    Route::post('/users', [UserController::class, 'store']);
});
