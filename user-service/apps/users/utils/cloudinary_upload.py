import cloudinary
import cloudinary.uploader

from django.conf import settings

def upload_avatar_to_cloudinary(image_file, folder="avatars"):
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )
    res = cloudinary.uploader.upload(image_file, folder=folder)
    return res.get("secure_url")
