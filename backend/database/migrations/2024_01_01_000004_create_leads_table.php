<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('contact_name');
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->unsignedBigInteger('value')->default(0);
            $table->enum('status', ['new','contacted','qualified','proposal','negotiation','closed_won','closed_lost'])->default('new');
            $table->enum('priority', ['high','medium','low'])->default('medium');
            $table->date('last_contact_date')->nullable();
            $table->date('next_followup_date')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedTinyInteger('ai_score')->nullable();
            $table->text('ai_reason')->nullable();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'priority']);
            $table->index('ai_score');
            $table->index('next_followup_date');
        });
    }

    public function down(): void { Schema::dropIfExists('leads'); }
};
