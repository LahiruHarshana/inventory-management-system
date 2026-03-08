<?php

namespace App\Http\Controllers;

use App\Models\Cupboard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CupboardController extends Controller
{
    public function index(): JsonResponse
    {
        $cupboards = Cupboard::query()
            ->latest('id')
            ->paginate(15);

        return response()->json($cupboards);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $cupboard = Cupboard::query()->create($validated);

        return response()->json([
            'message' => 'Cupboard created successfully.',
            'data' => $cupboard,
        ], 201);
    }

    public function show(Cupboard $cupboard): JsonResponse
    {
        return response()->json([
            'data' => $cupboard,
        ]);
    }

    public function update(Request $request, Cupboard $cupboard): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $cupboard->update($validated);

        return response()->json([
            'message' => 'Cupboard updated successfully.',
            'data' => $cupboard,
        ]);
    }

    public function destroy(Cupboard $cupboard): JsonResponse
    {
        $cupboard->delete();

        return response()->json([
            'message' => 'Cupboard deleted successfully.',
        ]);
    }
}
