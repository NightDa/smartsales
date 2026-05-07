<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('industry', ['tech', 'healthcare', 'finance', 'retail', 'other'])->default('other');
            $table->string('website')->nullable();
            $table->enum('size', ['1-10', '11-50', '51-200', '201-1000', '1000+'])->nullable();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('companies'); }
};
