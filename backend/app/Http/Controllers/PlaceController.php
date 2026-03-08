<?php

namespace App\Http\Controllers;

use App\Models\Place;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlaceController extends Controller
{
    public function index(): JsonResponse
    {
        $places = Place::query()
            ->with('cupboard')
            ->latest('id')
            ->paginate(15);

        return response()->json($places);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cupboard_id' => ['required', 'integer', Rule::exists('cupboards', 'id')],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $place = Place::query()->create($validated);

        return response()->json([
            'message' => 'Place created successfully.',
            'data' => $place->load('cupboard'),
        ], 201);
    }

    public function show(Place $place): JsonResponse
    {
        return response()->json([
            'data' => $place->load('cupboard'),
        ]);
    }

    public function update(Request $request, Place $place): JsonResponse
    {
        $validated = $request->validate([
            'cupboard_id' => ['required', 'integer', Rule::exists('cupboards', 'id')],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $place->update($validated);

        return response()->json([
            'message' => 'Place updated successfully.',
            'data' => $place->load('cupboard'),
        ]);
    }

    public function destroy(Place $place): JsonResponse
    {
        $place->delete();

        return response()->json([
            'message' => 'Place deleted successfully.',
        ]);
    }
}
