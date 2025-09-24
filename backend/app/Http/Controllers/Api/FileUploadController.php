<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FileUploadController extends Controller
{
    /**
     * Upload image file (avatar or cover photo)
     */
    public function uploadImage(Request $request)
    {
        $validator = \Validator::make($request->all(), [
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            'cover_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240', // 10MB max
            'type' => 'required|in:avatar,cover_photo',
        ], [
            'avatar.image' => 'Avatar must be an image file.',
            'avatar.mimes' => 'Avatar must be a JPEG, PNG, JPG, or GIF file.',
            'avatar.max' => 'Avatar file size must not exceed 5MB.',
            'cover_photo.image' => 'Cover photo must be an image file.',
            'cover_photo.mimes' => 'Cover photo must be a JPEG, PNG, JPG, or GIF file.',
            'cover_photo.max' => 'Cover photo file size must not exceed 10MB.',
            'type.required' => 'File type is required.',
            'type.in' => 'File type must be either avatar or cover_photo.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = null;
            $type = $request->type;

            // Get the appropriate file based on type
            if ($type === 'avatar' && $request->hasFile('avatar')) {
                $file = $request->file('avatar');
            } elseif ($type === 'cover_photo' && $request->hasFile('cover_photo')) {
                $file = $request->file('cover_photo');
            }

            if (!$file) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No file provided for upload'
                ], 400);
            }

            // Generate unique filename
            $extension = $file->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $extension;
            
            // Determine storage path based on type
            $path = $type === 'avatar' ? 'avatars' : 'cover-photos';
            $publicPath = public_path($path);
            
            // Create directory if it doesn't exist
            if (!file_exists($publicPath)) {
                mkdir($publicPath, 0755, true);
            }
            
            $fullPath = $publicPath . '/' . $filename;

            // Move file to public directory
            $file->move($publicPath, $filename);

            // Generate public URL
            $url = '/' . $path . '/' . $filename;

            return response()->json([
                'status' => 'success',
                'message' => 'File uploaded successfully',
                'data' => [
                    'filename' => $filename,
                    'path' => $path . '/' . $filename,
                    'url' => $url,
                    'type' => $type
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to upload file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete image file
     */
    public function deleteImage(Request $request)
    {
        $validator = \Validator::make($request->all(), [
            'url' => 'required|string',
            'type' => 'required|in:avatar,cover_photo',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $url = $request->url;
            $type = $request->type;

            // Extract filename from URL
            $path = parse_url($url, PHP_URL_PATH);
            $filename = basename($path);

            // Determine public path
            $directory = $type === 'avatar' ? 'avatars' : 'cover-photos';
            $filePath = public_path($directory . '/' . $filename);

            // Delete file if it exists
            if (file_exists($filePath)) {
                unlink($filePath);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'File deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete file',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
