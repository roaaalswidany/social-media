/* eslint-disable @typescript-eslint/no-unused-vars */
import { writeFile } from 'fs/promises'
import { join } from 'path'

export class UploadService {
  static async uploadImage(file: File, userId: string): Promise<string> {
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()
      const filename = `post-${userId}-${timestamp}.${extension}`
      
      const uploadDir = join(process.cwd(), 'public/uploads')
      const filepath = join(uploadDir, filename)
      
      await writeFile(filepath, buffer)
      
      return `/uploads/${filename}`
      
    } catch (error) {
      throw new Error('Failed to upload image')
    }
  }
}