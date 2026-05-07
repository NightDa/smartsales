<?php
namespace App\Providers;

use App\Models\Company;
use App\Models\Lead;
use App\Policies\CompanyPolicy;
use App\Policies\LeadPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Company::class => CompanyPolicy::class,
        Lead::class    => LeadPolicy::class,
    ];

    public function boot(): void { $this->registerPolicies(); }
}
