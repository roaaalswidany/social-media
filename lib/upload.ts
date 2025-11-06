import fs from 'fs'
import path from 'path'

export class UploadService {
  private static uploadDir = path.join(process.cwd(), 'public', 'uploads')
  private static allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  private static maxFileSize = 5 * 1024 * 1024 // 5MB

  static async uploadImage(file: File, userId: string): Promise<string> {
    if (!this.allowedMimeTypes.includes(file.type)) {
      throw new Error('File type not supported. Please use JPEG, PNG, GIF, or WebP')
    }

    if (file.size > this.maxFileSize) {
      throw new Error('File size too large. Maximum 5MB')
    }

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }

    const mimeToExt: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp'
    }

    const fileExtension = mimeToExt[file.type] || '.jpg'
    const fileName = `${userId}-${Date.now()}${fileExtension}`
    const filePath = path.join(this.uploadDir, fileName)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await fs.promises.writeFile(filePath, buffer)

    // return path relative to /public
    return `/uploads/${fileName}`
  }

  static async deleteImage(imagePath: string): Promise<void> {
    try {
      if (!imagePath) return
      const fullPath = path.join(process.cwd(), 'public', imagePath)
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath)
      }
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }
}