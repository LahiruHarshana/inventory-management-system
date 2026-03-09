<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CupboardController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\PlaceController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('cupboards', CupboardController::class);
    Route::apiResource('places', PlaceController::class);
    Route::apiResource('items', ItemController::class);
});

Route::middleware(['auth:sanctum', 'is_admin'])->group(function () {
    Route::post('/users', [UserController::class, 'store']);
});
