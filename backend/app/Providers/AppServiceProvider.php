<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Filesystem\Filesystem;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Force-register 'files' if not already bound
        if (!$this->app->bound('files')) {
            $this->app->singleton('files', function () {
                return new Filesystem;
            });
        }
    }

    public function boot(): void
    {
        // Lead::observe(LeadObserver::class); -- re-enable later
    }
}
