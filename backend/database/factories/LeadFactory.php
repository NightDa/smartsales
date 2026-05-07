<?php
namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeadFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title'              => fake()->sentence(4),
            'company_id'         => Company::factory(),
            'contact_name'       => fake()->name(),
            'contact_email'      => fake()->optional()->safeEmail(),
            'contact_phone'      => fake()->optional()->phoneNumber(),
            'value'              => fake()->numberBetween(10000, 5000000),
            'status'             => fake()->randomElement(['new','contacted','qualified','proposal','negotiation','closed_won','closed_lost']),
            'priority'           => fake()->randomElement(['high','medium','low']),
            'last_contact_date'  => fake()->optional()->dateTimeBetween('-60 days','now')?->format('Y-m-d'),
            'next_followup_date' => fake()->optional()->dateTimeBetween('now','+30 days')?->format('Y-m-d'),
            'notes'              => fake()->optional()->paragraph(),
            'ai_score'           => fake()->optional()->numberBetween(0, 100),
            'ai_reason'          => null,
            'user_id'            => User::factory(),
        ];
    }
    public function hot(): static     { return $this->state(['ai_score' => fake()->numberBetween(70,100)]); }
    public function cold(): static    { return $this->state(['ai_score' => fake()->numberBetween(0,29)]); }
    public function overdue(): static { return $this->state(['next_followup_date' => now()->subDays(5)->toDateString(), 'status' => 'contacted']); }
}
