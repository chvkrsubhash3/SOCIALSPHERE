import fs from 'fs';
import path from 'path';

export const minioClient = {
  async putObject(_bucket: string, objectName: string, buffer: Buffer, _metadata?: any) {
    const filePath = path.join(process.cwd(), 'public', 'uploads', objectName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return true;
  },
  async getObject(_bucket: string, objectName: string) {
    const filePath = path.join(process.cwd(), 'public', 'uploads', objectName);
    return fs.createReadStream(filePath);
  }
};
