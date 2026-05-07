<?php
namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Company;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin   = User::create(['name' => 'Admin User',    'email' => 'admin@smartsales.dev', 'password' => Hash::make('Password1'), 'role' => 'admin']);
        $manager = User::create(['name' => 'Sarah Manager', 'email' => 'sarah@smartsales.dev', 'password' => Hash::make('Password1'), 'role' => 'sales_manager']);
        $john    = User::create(['name' => 'John Agent',    'email' => 'john@smartsales.dev',  'password' => Hash::make('Password1'), 'role' => 'agent']);
        $lisa    = User::create(['name' => 'Lisa Agent',    'email' => 'lisa@smartsales.dev',  'password' => Hash::make('Password1'), 'role' => 'agent']);

        $agents    = [$john, $lisa];
        $companies = [
            Company::create(['name' => 'Acme Corp',       'industry' => 'tech',       'size' => '201-1000', 'website' => 'https://acme.example.com',       'user_id' => $admin->id]),
            Company::create(['name' => 'HealthFirst Inc',  'industry' => 'healthcare', 'size' => '51-200',   'website' => null,                              'user_id' => $admin->id]),
            Company::create(['name' => 'FinEdge Ltd',      'industry' => 'finance',    'size' => '11-50',    'website' => 'https://finedge.example.com',     'user_id' => $admin->id]),
            Company::create(['name' => 'RetailZone',       'industry' => 'retail',     'size' => '1000+',    'website' => 'https://retailzone.example.com',  'user_id' => $admin->id]),
        ];

        $statuses  = ['new','contacted','qualified','proposal','negotiation','closed_won','closed_lost'];
        $priorities = ['high','medium','low'];

        foreach ($companies as $i => $company) {
            $agent = $agents[$i % 2];
            foreach (range(1, 4) as $j) {
                $lead = Lead::create([
                    'title'              => "Deal #{$j} with {$company->name}",
                    'company_id'         => $company->id,
                    'contact_name'       => fake()->name(),
                    'contact_email'      => fake()->safeEmail(),
                    'contact_phone'      => fake()->phoneNumber(),
                    'value'              => fake()->numberBetween(50000, 10000000),
                    'status'             => $statuses[array_rand($statuses)],
                    'priority'           => $priorities[array_rand($priorities)],
                    'last_contact_date'  => fake()->dateTimeBetween('-30 days','now')->format('Y-m-d'),
                    'next_followup_date' => fake()->dateTimeBetween('now','+14 days')->format('Y-m-d'),
                    'notes'              => fake()->paragraph(),
                    'ai_score'           => fake()->numberBetween(10, 95),
                    'ai_reason'          => 'Seeded demo score.',
                    'user_id'            => $agent->id,
                ]);
                Activity::create(['lead_id' => $lead->id, 'user_id' => $agent->id, 'type' => 'note_added',  'content' => 'Lead created.']);
                Activity::create(['lead_id' => $lead->id, 'user_id' => $agent->id, 'type' => 'call_made',   'content' => 'Initial discovery call. Interest confirmed.']);
            }
        }

        $this->command->info('✅ Demo seeded. Login: admin@smartsales.dev / Password1');
    }
}
