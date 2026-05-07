<?php
namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    public function definition(): array
    {
        return ['name' => fake()->company(), 'industry' => fake()->randomElement(['tech','healthcare','finance','retail','other']), 'website' => fake()->optional()->url(), 'size' => fake()->randomElement(['1-10','11-50','51-200','201-1000','1000+']), 'user_id' => User::factory()];
    }
}
