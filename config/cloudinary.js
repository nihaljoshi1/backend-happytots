const cloudinary=require("cloudinary").v2

const connectCloudinary = async () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.COUDINARY_API_KEY,
    api_secret: process.env.COUDINARY_SECRET_KEY
  })
}

module.exports = connectCloudinary;