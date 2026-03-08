<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate([
            'email' => 'admin@flxware.com',
        ], [
            'name' => 'System Admin',
            'password' => 'password',
            'role' => 'admin',
        ]);
    }
}
