<?php

namespace App\Http\Controllers;

use App\Models\Borrowing;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BorrowingController extends Controller
{
    public function index(): JsonResponse
    {
        $borrowings = Borrowing::query()
            ->with(['item', 'processedBy'])
            ->latest('id')
            ->paginate(15);

        return response()->json($borrowings);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_id' => ['required', 'integer', Rule::exists('items', 'id')],
            'borrower_name' => ['required', 'string', 'max:255'],
            'contact_details' => ['required', 'string'],
            'borrowed_qty' => ['required', 'integer', 'min:1'],
            'expected_return_date' => ['required', 'date', 'after_or_equal:today'],
        ]);

        $borrowing = DB::transaction(function () use ($request, $validated) {
            $item = Item::where('id', $validated['item_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($item->available_quantity < $validated['borrowed_qty']) {
                return null;
            }

            $item->available_quantity -= $validated['borrowed_qty'];

            if ($item->available_quantity === 0) {
                $item->status = 'Borrowed';
            }

            $item->save();

            return Borrowing::query()->create([
                'item_id' => $validated['item_id'],
                'borrower_name' => $validated['borrower_name'],
                'contact_details' => $validated['contact_details'],
                'borrowed_qty' => $validated['borrowed_qty'],
                'borrow_date' => now()->toDateString(),
                'expected_return_date' => $validated['expected_return_date'],
                'status' => 'Active',
                'processed_by' => $request->user()->id,
            ]);
        });

        if (!$borrowing) {
            return response()->json([
                'message' => 'Insufficient quantity',
            ], 400);
        }

        return response()->json([
            'message' => 'Item borrowed successfully.',
            'data' => $borrowing->load(['item', 'processedBy']),
        ], 201);
    }

    public function returnItem(Request $request, int $id): JsonResponse
    {
        $borrowing = Borrowing::query()->findOrFail($id);

        if ($borrowing->status === 'Returned') {
            return response()->json([
                'message' => 'This borrowing is already returned.',
            ], 400);
        }

        DB::transaction(function () use ($borrowing) {
            $item = Item::where('id', $borrowing->item_id)
                ->lockForUpdate()
                ->firstOrFail();

            $item->available_quantity += $borrowing->borrowed_qty;
            $item->status = 'In-Store';
            $item->save();

            $borrowing->returned_date = now()->toDateString();
            $borrowing->status = 'Returned';
            $borrowing->save();
        });

        return response()->json([
            'message' => 'Item returned successfully.',
            'data' => $borrowing->fresh()->load(['item', 'processedBy']),
        ]);
    }
}
