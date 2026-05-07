<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class AiPromptsLog extends Model
{
    protected $table    = 'ai_prompts_log';
    protected $fillable = ['user_id','prompt_type','prompt_text','response_text','tokens_used'];
    public function user(){ return $this->belongsTo(User::class); }
}
