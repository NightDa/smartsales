<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Attachment extends Model
{
    protected $fillable = ['lead_id','user_id','filename','path','mime_type','size'];
    protected $appends  = ['url'];

    public function lead()    { return $this->belongsTo(Lead::class); }
    public function uploader(){ return $this->belongsTo(User::class, 'user_id'); }

    public function getUrlAttribute(): string
    {
        // Local disk: generate temporary URL; swap for Storage::temporaryUrl in prod with S3
        return Storage::url($this->path);
    }
}
