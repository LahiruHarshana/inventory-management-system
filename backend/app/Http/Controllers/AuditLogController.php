<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $auditLogs = AuditLog::query()
            ->with('user')
            ->latest('created_at')
            ->paginate(20);

        return response()->json($auditLogs);
    }
}
