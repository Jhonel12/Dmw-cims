<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class CheckTokenActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        if ($request->user()) {
            $token = $request->user()->currentAccessToken();
            $tokenId = $token->id;
            $cacheKey = 'token_last_activity_' . $tokenId;
            
            // Get the last activity time from cache
            $lastActivity = Cache::get($cacheKey);
            
            // Check if "remember me" is enabled (token has 'remember' ability)
            $isRememberMe = $token->can('remember');
            
            // Define idle timeout based on remember me status
            // Remember me: 30 days (2,592,000 seconds)
            // Normal: 3 hours (10,800 seconds)
            $idleTimeout = $isRememberMe ? 2592000 : 10800;
            
            $currentTime = time();
            $idleTime = $lastActivity ? ($currentTime - $lastActivity) : 0;
            
            \Log::info('Token Activity Check', [
                'token_id' => $tokenId,
                'remember_me' => $isRememberMe,
                'last_activity' => $lastActivity,
                'current_time' => $currentTime,
                'idle_time' => $idleTime,
                'timeout_limit' => $idleTimeout,
                'is_expired' => ($lastActivity && $idleTime > $idleTimeout)
            ]);
            
            // Check if token has been idle for too long
            if ($lastActivity && $idleTime > $idleTimeout) {
                \Log::warning('Session Expired', [
                    'token_id' => $tokenId,
                    'idle_seconds' => $idleTime
                ]);
                
                // Delete the token
                $request->user()->currentAccessToken()->delete();
                
                // Clear the cache
                Cache::forget($cacheKey);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Session expired due to inactivity',
                    'code' => 'SESSION_EXPIRED'
                ], 401);
            }
            
            // Update the last activity time
            // Cache duration: 1 hour longer than timeout to ensure data persists
            $cacheDuration = $isRememberMe ? now()->addDays(31) : now()->addHours(4);
            Cache::put($cacheKey, $currentTime, $cacheDuration);
            
            \Log::info('Token Activity Updated', [
                'token_id' => $tokenId,
                'new_activity_time' => $currentTime
            ]);
        }
        
        return $next($request);
    }
}