<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('leads:score --limit=1000')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('leads:detect-anomalies')
    ->everySixHours()
    ->withoutOverlapping()
    ->runInBackground();
