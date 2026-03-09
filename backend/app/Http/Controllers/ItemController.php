<?php

namespace App\Http\Controllers;

use App\Models\Item;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

class ItemController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Item::query()
            ->with('place')
            ->latest('id')
            ->paginate(15);

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'place_id' => ['required', 'integer', Rule::exists('places', 'id')],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255', Rule::unique('items', 'code')],
            'description' => ['nullable', 'string'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'total_quantity' => ['required', 'integer', 'min:0'],
            'status' => ['required', Rule::in(['In-Store', 'Borrowed', 'Damaged', 'Missing'])],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')
                ->storeOnCloudinary('inventory')
                ->getSecurePath();
        }

        $validated['available_quantity'] = $validated['total_quantity'];

        $item = Item::query()->create($validated);

        return response()->json([
            'message' => 'Item created successfully.',
            'data' => $item->load('place'),
        ], 201);
    }

    public function show(Item $item): JsonResponse
    {
        return response()->json([
            'data' => $item->load('place'),
        ]);
    }

    public function update(Request $request, Item $item): JsonResponse
    {
        $validated = $request->validate([
            'place_id' => ['sometimes', 'required', 'integer', Rule::exists('places', 'id')],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('items', 'code')->ignore($item->id)],
            'description' => ['nullable', 'string'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'total_quantity' => ['sometimes', 'required', 'integer', 'min:0'],
            'status' => ['sometimes', 'required', Rule::in(['In-Store', 'Borrowed', 'Damaged', 'Missing'])],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            $this->deleteCloudinaryAssetFromUrl($item->image_path);

            $validated['image_path'] = $request->file('image')
                ->storeOnCloudinary('inventory')
                ->getSecurePath();
        }

        if (array_key_exists('total_quantity', $validated) && $item->available_quantity > $validated['total_quantity']) {
            $validated['available_quantity'] = $validated['total_quantity'];
        }

        $item->update($validated);

        return response()->json([
            'message' => 'Item updated successfully.',
            'data' => $item->refresh()->load('place'),
        ]);
    }

    public function destroy(Item $item): JsonResponse
    {
        $this->deleteCloudinaryAssetFromUrl($item->image_path);

        $item->delete();

        return response()->json([
            'message' => 'Item deleted successfully.',
        ]);
    }

    private function deleteCloudinaryAssetFromUrl(?string $url): void
    {
        if (!$url) {
            return;
        }

        $publicId = $this->extractPublicIdFromUrl($url);

        if (!$publicId) {
            return;
        }

        try {
            Cloudinary::destroy($publicId);
        } catch (Throwable) {
            // Do not block API flow if Cloudinary deletion fails.
        }
    }

    private function extractPublicIdFromUrl(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);

        if (!$path || !str_contains($path, '/upload/')) {
            return null;
        }

        $afterUpload = explode('/upload/', $path, 2)[1] ?? null;

        if (!$afterUpload) {
            return null;
        }

        $segments = explode('/', ltrim($afterUpload, '/'));

        if (isset($segments[0]) && preg_match('/^v\d+$/', $segments[0])) {
            array_shift($segments);
        }

        if (empty($segments)) {
            return null;
        }

        $last = array_pop($segments);
        $last = pathinfo($last, PATHINFO_FILENAME);
        $segments[] = $last;

        return implode('/', $segments);
    }
}
